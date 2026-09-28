package dao

import (
	"brand-flow-server/config"
	"brand-flow-server/model"

	"gorm.io/gorm"
)

type UserDao struct {
	db *gorm.DB
}

func NewUserDao() *UserDao {
	return &UserDao{db: config.DB}
}

// 按用户名查用户，找不到返回 gorm.ErrRecordNotFound
// 接收者 		 函数名           入参             返回值
func (d *UserDao) FindByUsername(username string) (*model.User, error) {
	var user model.User
	err := d.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// 插入一个新用户
func (d *UserDao) Create(user *model.User) error {
	return d.db.Create(user).Error
}

// 按照 ID 查用户
func (d *UserDao) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := d.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}
