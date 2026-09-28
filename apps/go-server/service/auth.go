package service

import (
	"errors"

	"brand-flow-server/dao"
	"brand-flow-server/model"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userDao *dao.UserDao
}

// 构造函数
func NewAuthService() *AuthService {
	return &AuthService{
		userDao: dao.NewUserDao(),
	}
}

func (s *AuthService) Register(username, password string) (*model.User, error) {
	//1.先查一下这个用户名有没有被注册过
	existing, err := s.userDao.FindByUsername(username)
	// err == nil 说明查到了有人，即用户名已存在
	if err == nil && existing != nil {
		return nil, errors.New("用户名已存在！")
	}

	//2.把明文密码加密成一串乱码，不能存明文
	// bcrypt.DefaultCost 是加密强度，数字越大越安全但是越慢
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	//3.组装成一个user对象，准备插入库
	user := &model.User{
		Username: username,
		Password: string(hashedPassword),
	}
	//4.调用 dao 插入数据库
	err = s.userDao.Create(user)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// Login 登录，传用户名和密码，对了返回用户，错了返回错误
func (s *AuthService) Login(username, password string) (*model.User, error) {
	//1.按用户名查用户
	user, err := s.userDao.FindByUsername(username)
	if err != nil {
		//没查到，返回“用户名或密码错误”
		return nil, errors.New("用户名或密码错误")
	}
	//2.比对密码，拿数据库里的加密密码+用户传的明文密码比对
	// 注意：数据库里的是加密后的，不能直接 == 比
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("用户名或密码错误")
	}
	return user, nil
}

//这个文件负责注册和登录功能的实现，注册：检查用户名是否重复，登录：查某个用户在数据库里是否存在
