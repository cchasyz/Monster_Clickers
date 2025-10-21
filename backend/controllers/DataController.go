package controllers

import (
	"monster_clicker/config"
	"monster_clicker/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetGameData - get the current user's game data
func GetGameData(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var data models.GameData
	if err := config.DB.Where("user_id = ?", userID).First(&data).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game data not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"game_data": data})
}

// UpdateGameData - update the user's game data (e.g., after a click)
func UpdateGameData(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input models.GameData
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var data models.GameData
	if err := config.DB.Where("user_id = ?", userID).First(&data).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Game data not found"})
		return
	}

	// Update fields (use only fields provided)
	data.MonsterShard = input.MonsterShard
	data.ClickPower = input.ClickPower
	data.HelperCost = input.HelperCost
	data.SoulShards = input.SoulShards

	if err := config.DB.Save(&data).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update game data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Game data updated successfully",
		"game_data": data,
	})
}