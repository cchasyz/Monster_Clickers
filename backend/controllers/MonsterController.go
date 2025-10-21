package controllers

import (
	"fmt"
	"monster_clicker/config"
	"monster_clicker/models"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// CreateMonster — add a new monster for the authenticated user
func CreateMonster(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	name := c.PostForm("name")
	hp := c.PostForm("hp")
	reward := c.PostForm("reward")

	// Validate required fields
	if name == "" || hp == "" || reward == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, hp, and reward are required"})
		return
	}

	// Handle image upload
	file, err := c.FormFile("photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Photo file is required"})
		return
	}

	// Ensure directory exists
	savePath := "./public/monsters"
	if _, err := os.Stat(savePath); os.IsNotExist(err) {
		os.MkdirAll(savePath, os.ModePerm)
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().UnixNano(), ext)
	fullPath := filepath.Join(savePath, filename)

	// Save file to disk
	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	// Construct URL (assuming server serves /public)
	baseURL := "http://localhost:8080"
	photoURL := fmt.Sprintf("%s/public/monsters/%s", baseURL, filename)

	// Parse numeric fields
	var monster models.Monster
	_, errHp := fmt.Sscan(hp, &monster.HP)
	_, errReward := fmt.Sscan(reward, &monster.Reward)
	if errHp != nil || errReward != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid numeric values for hp or reward"})
		return
	}

	// Save monster to database
	monster.UserID = userID.(uint)
	monster.Name = name
	monster.PhotoURL = photoURL

	if err := config.DB.Create(&monster).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Monster created successfully",
		"monster": monster,
	})
}

// GetMonsters — list all monsters belonging to current user
func GetMonsters(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var monsters []models.Monster
	if err := config.DB.Where("user_id = ?", userID).Find(&monsters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"monsters": monsters})
}

type UpdateNFTRequest struct {
    MonsterID uint   `json:"monster_id"`
    TokenID   string `json:"token_id"`
}

func UpdateMonsterNFT(c *gin.Context) {
    var req UpdateNFTRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request"})
        return
    }

    var monster models.Monster
    if err := config.DB.First(&monster, req.MonsterID).Error; err != nil {
        c.JSON(404, gin.H{"error": "Monster not found"})
        return
    }

    monster.TokenID = req.TokenID
    config.DB.Save(&monster)

    c.JSON(200, gin.H{"message": "NFT token ID updated!", "monster": monster})
}