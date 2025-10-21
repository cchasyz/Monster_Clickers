package main

import (
	"monster_clicker/config"
	"monster_clicker/controllers"
	"monster_clicker/middleware"
	"log"

	
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
	config.Connect()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.Static("/public", "./public")

	r.POST("/register", controllers.Register) 
	r.POST("/login", controllers.Login)

	r.POST("/logout", middleware.AuthMiddleware(), controllers.Logout)

	r.POST("/create/monster", middleware.AuthMiddleware(), controllers.CreateMonster)
	r.GET("/get/monster", middleware.AuthMiddleware(), controllers.GetMonsters)
	r.POST("/update/monsterNFT", middleware.AuthMiddleware(), controllers.UpdateMonsterNFT)

	// r.POST("/game-data", middleware.AuthMiddleware(), func(c *gin.Context) {
	// 	userID, _ := c.Get("user_id")
	// 	if err := controllers.CreateOrInitGameData(userID.(uint)); err != nil {
	// 		c.JSON(500, gin.H{"error": "Failed to create game data"})
	// 		return
	// 	}
	// 	c.JSON(200, gin.H{"message": "Game data initialized"})
	// })

	r.GET("/data", middleware.AuthMiddleware(), controllers.GetGameData)
	r.PUT("/data", middleware.AuthMiddleware(), controllers.UpdateGameData)

	r.Run(":8080")
}