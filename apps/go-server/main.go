package main

import (
	"brand-flow-server/common/middleware"
	"brand-flow-server/config"
	"brand-flow-server/controller"
	"brand-flow-server/model"

	"github.com/gin-gonic/gin"
)

func main() {
	config.InitDB()
	// 自动建表
	config.DB.AutoMigrate(&model.User{})

	r := gin.Default()

	authCtrl := controller.NewAuthController()
	r.POST("/auth/register", authCtrl.Register)
	r.POST("/auth/login", authCtrl.Login)
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"data":    "hello",
		})
	})
	// 需要登录才能访问的接口，挂上 AuthRequired 中间件
	auth := r.Group("/auth")
	auth.Use(middleware.AuthRequired())
	auth.GET("/profile", authCtrl.Profile)

	r.Run(":8080")
}
