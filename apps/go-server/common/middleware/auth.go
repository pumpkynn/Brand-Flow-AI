package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// 签 token 用的密钥，后面放到 config 里也行，先写死
var jwtSecret = []byte("brand-flow-secret-key")

// 登录成功后签 token，里面存用户 ID
func GenerateToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"userID": userID,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// AuthRequired 中间件：验证请求头里的 token
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 从请求头拿 Authorization: Bearer xxx
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "未登录",
			})
			return
		}

		// 2. 去掉 "Bearer " 前缀，拿到真正的 token
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		// 3. 解析并验证 token
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "token 无效: " + err.Error(),
			})
			fmt.Println("收到的 token:", tokenStr)
			return
		}

		// 4. 从 token 里取出 userID，塞到请求上下文里，后面 controller 能用
		claims := token.Claims.(jwt.MapClaims)
		userID := uint(claims["userID"].(float64))
		c.Set("userID", userID)

		c.Next()
	}
}
