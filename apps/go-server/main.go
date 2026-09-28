package main

import (
	"brand-flow-server/config"

	"github.com/gin-gonic/gin"
)

func main() {
	config.InitDB()

	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"data":    "hello",
		})
	})

	r.Run(":8080")
}
