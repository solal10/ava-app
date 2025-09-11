const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AVA Coach Santé IA - API Documentation',
      version: '1.0.0',
      description: `
        API complète pour l'application AVA Coach Santé IA
        
        ## Authentification
        La plupart des endpoints nécessitent une authentification via token JWT.
        Ajoutez le header: \`Authorization: Bearer <votre_token>\`
        
        ## Niveaux d'abonnement
        - **explore** : Fonctionnalités de base gratuites
        - **perform** : Données cardiaques et chat IA illimité
        - **pro** : Toutes les fonctionnalités Perform + analyse de stress et performance
        - **elite** : Toutes les fonctionnalités Pro + score nutritionnel et coach personnel
        
        ## Codes d'erreur
        - **400** : Requête incorrecte
        - **401** : Non authentifié
        - **403** : Accès refusé (niveau d'abonnement insuffisant)
        - **404** : Ressource non trouvée
        - **429** : Trop de requêtes
        - **500** : Erreur serveur
      `,
      contact: {
        name: 'Équipe AVA Coach Santé',
        email: 'support@ava-coach.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5003',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.ava-coach.com',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu lors de la connexion'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Identifiant unique de l\'utilisateur'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur'
            },
            username: {
              type: 'string',
              description: 'Nom d\'utilisateur unique'
            },
            subscriptionLevel: {
              type: 'string',
              enum: ['explore', 'perform', 'pro', 'elite'],
              description: 'Niveau d\'abonnement actuel'
            },
            profile: {
              $ref: '#/components/schemas/UserProfile'
            },
            preferences: {
              $ref: '#/components/schemas/UserPreferences'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            age: { type: 'integer', minimum: 13, maximum: 120 },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            height: { type: 'number', description: 'Taille en cm' },
            weight: { type: 'number', description: 'Poids en kg' },
            activityLevel: {
              type: 'string',
              enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
            }
          }
        },
        UserPreferences: {
          type: 'object',
          properties: {
            notifications: {
              type: 'object',
              properties: {
                email: { type: 'boolean' },
                push: { type: 'boolean' },
                sms: { type: 'boolean' }
              }
            },
            coaching: {
              type: 'object',
              properties: {
                intensity: { type: 'string', enum: ['light', 'moderate', 'intense'] },
                frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
                focusAreas: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['nutrition', 'exercise', 'sleep', 'stress', 'hydration']
                  }
                }
              }
            }
          }
        },
        Meal: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
            calories: { type: 'number', minimum: 0 },
            nutrients: {
              type: 'object',
              properties: {
                proteines: { type: 'number', minimum: 0 },
                lipides: { type: 'number', minimum: 0 },
                glucides: { type: 'number', minimum: 0 },
                fibres: { type: 'number', minimum: 0 }
              }
            },
            mealType: {
              type: 'string',
              enum: ['petit_dejeuner', 'dejeuner', 'diner', 'collation']
            },
            date: { type: 'string', format: 'date-time' },
            aiAnalysis: {
              type: 'object',
              properties: {
                foodItems: {
                  type: 'array',
                  items: { type: 'string' }
                },
                healthScore: { type: 'number', minimum: 0, maximum: 100 },
                recommendations: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        },
        HealthMetrics: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            metrics: {
              type: 'object',
              properties: {
                sommeil: {
                  type: 'object',
                  properties: {
                    heures: { type: 'number', minimum: 0, maximum: 24 },
                    qualite: { type: 'number', minimum: 0, maximum: 100 }
                  }
                },
                stress: {
                  type: 'object',
                  properties: {
                    niveau: { type: 'number', minimum: 0, maximum: 100 },
                    facteurs: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                },
                hydratation: {
                  type: 'object',
                  properties: {
                    verresEau: { type: 'number', minimum: 0 },
                    score: { type: 'number', minimum: 0, maximum: 100 }
                  }
                },
                energie: {
                  type: 'object',
                  properties: {
                    niveau: { type: 'number', minimum: 0, maximum: 100 },
                    facteurs: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                },
                activite: {
                  type: 'object',
                  properties: {
                    duree: { type: 'number', minimum: 0 },
                    type: {
                      type: 'string',
                      enum: ['cardio', 'musculation', 'yoga', 'marche', 'course', 'natation', 'velo', 'autre']
                    },
                    intensite: { type: 'number', minimum: 0, maximum: 10 }
                  }
                }
              }
            },
            healthScore: { type: 'number', minimum: 0, maximum: 100 },
            source: {
              type: 'string',
              enum: ['manual', 'garmin', 'apple', 'fitbit', 'ai_prediction']
            }
          }
        },
        GarminData: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            dataType: {
              type: 'string',
              enum: ['daily_summary', 'activity', 'sleep', 'stress', 'heart_rate', 'body_composition']
            },
            basicMetrics: {
              type: 'object',
              properties: {
                steps: { type: 'number' },
                distance: { type: 'number' },
                calories: { type: 'number' },
                floorsClimbed: { type: 'number' },
                activeMinutes: {
                  type: 'object',
                  properties: {
                    vigorous: { type: 'number' },
                    moderate: { type: 'number' },
                    total: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message d\'erreur descriptif'
            },
            code: {
              type: 'string',
              description: 'Code d\'erreur pour le debugging'
            },
            details: {
              type: 'object',
              description: 'Détails additionnels sur l\'erreur'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Message de confirmation'
            },
            data: {
              type: 'object',
              description: 'Données retournées'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token d\'authentification manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                message: 'Token d\'authentification requis',
                code: 'AUTH_REQUIRED'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Accès refusé - niveau d\'abonnement insuffisant',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                message: 'Abonnement Pro requis pour accéder à cette fonctionnalité',
                code: 'SUBSCRIPTION_REQUIRED',
                details: {
                  required: 'pro',
                  current: 'explore'
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                message: 'Données invalides',
                code: 'VALIDATION_ERROR',
                details: {
                  email: 'Email invalide',
                  age: 'L\'âge doit être entre 13 et 120 ans'
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                message: 'Utilisateur non trouvé',
                code: 'USER_NOT_FOUND'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Limite de taux atteinte',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                message: 'Trop de requêtes, veuillez réessayer plus tard',
                code: 'RATE_LIMIT_EXCEEDED'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/api/**/*.routes.js',
    './src/api/**/*.controller.js'
  ]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
  swaggerDocs,
  swaggerUi,
  swaggerOptions
};