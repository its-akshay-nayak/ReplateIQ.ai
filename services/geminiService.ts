
import { GoogleGenAI, Type } from "@google/genai";
import { CarbonAnalysis, Recipe, UserProfile, MealType, DishPrediction, CuisineType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const carbonSchema = {
  type: Type.OBJECT,
  properties: {
    dishName: { type: Type.STRING },
    quantity: { type: Type.NUMBER },
    scenarios: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          co2e: { type: Type.NUMBER },
          description: { type: Type.STRING },
          icon: { type: Type.STRING, enum: ['trash', 'snowflake', 'bike', 'car', 'walk'] },
          isRecommended: { type: Type.BOOLEAN },
        },
        required: ['action', 'co2e', 'description', 'icon', 'isRecommended'],
      },
    },
    recommendation: { type: Type.STRING },
    impactSummary: { type: Type.STRING },
  },
  required: ['dishName', 'quantity', 'scenarios', 'recommendation', 'impactSummary'],
};

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    recipeName: { type: Type.STRING },
    description: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    flexibleIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    nutrition: {
      type: Type.OBJECT,
      properties: {
        standard: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.STRING },
            carbs: { type: Type.STRING },
            fats: { type: Type.STRING },
          },
        },
        healthy: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.STRING },
            carbs: { type: Type.STRING },
            fats: { type: Type.STRING },
          },
        },
      },
    },
    healthTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    healthySwaps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          replacement: { type: Type.STRING },
          reason: { type: Type.STRING },
          calorieReduction: { type: Type.STRING },
        },
      },
    },
    alternativeDishes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
      },
    },
    matchScore: { type: Type.NUMBER },
  },
};

const predictionSchema = {
  type: Type.OBJECT,
  properties: {
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    calories: { type: Type.NUMBER },
    refinements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          targetIngredient: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
  },
};

export const analyzeCarbonFootprint = async (
  dishName: string,
  quantity: number,
  location: string
): Promise<CarbonAnalysis> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are an Environmental Scientist using EPA WARM and IPCC standards. 
    The user has excess food: ${quantity} servings of "${dishName}" in "${location}".
    
    Task: Compare the Carbon Footprint (CO2e in kg) of these scenarios:
    1. Wasting/Trashing the food: Calculate Methane emissions from landfill decomposition. USE EPA WARM standards (approx 2.5kg CO2e per kg of food waste). This is critical - do not underestimate waste emissions.
    2. Storing in Refrigerator for 3 days: Energy usage.
    3. Delivering to a neighbor (Walking/Cycling 0.5km): Zero emissions.
    4. Delivering to a charity/friend further away (Car 5km): Transport emissions.
    
    Output structured data comparing these. Ensure "Wasting" has a realistic, high CO2e value reflecting the environmental cost.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: carbonSchema,
        temperature: 0.5
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CarbonAnalysis;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze carbon footprint.");
  }
};

export const generateRecipeFromIngredients = async (
  ingredients: string[],
  profile: UserProfile,
  mealType: MealType,
  cuisine: CuisineType,
  specificDishName?: string
): Promise<Recipe> => {
    const model = "gemini-2.5-flash";
    
    // Construct ingredient string
    const coreIngredientsStr = ingredients.join(", ");
    const healthGoalsStr = profile.healthGoals.join(", ");

    // Determine strict health constraints
    let healthDirectives = "";
    const lowerLipids = profile.healthGoals.some(g => g.includes("Triglycerides") || g.includes("Cholesterol") || g.includes("Heart"));
    const lowCarb = profile.healthGoals.some(g => g.includes("Low Carb") || g.includes("Keto"));
    const diabetic = profile.healthGoals.some(g => g.includes("Diabetic"));

    if (lowerLipids) {
        healthDirectives += `
        CRITICAL HEALTH OVERRIDE (Lower Triglycerides/Cholesterol):
        - ABSOLUTELY NO DEEP FRYING. (Do not suggest Fritters, Pakoras, Poori, or deep-fried snacks).
        - If ingredients suggest a fried item (e.g., Dal), you MUST pivot to a Steamed (e.g., Dhokla/Idli/Muthiya), Baked, or Soupy version (Dal Tadka with minimal oil).
        - Minimize saturated fats (Butter, Ghee, Heavy Cream, Cheese). Use healthy oils (Olive/Avocado) sparingly.
        - Prioritize high fiber.
        `;
    }
    if (lowCarb || diabetic) {
        healthDirectives += `
        CRITICAL HEALTH OVERRIDE (Low Carb/Diabetic):
        - Minimize refined flours, sugars, and potatoes.
        - Focus on protein and fiber.
        `;
    }

    const prompt = `
        Create a ${cuisine === 'Global' ? 'Creative' : cuisine} style ${mealType} recipe.
        
        AVAILABLE INGREDIENTS: ${coreIngredientsStr}
        ${specificDishName ? `Focus on making: ${specificDishName}` : "Suggest a creative dish based on these ingredients."}
        
        User Profile:
        Name: ${profile.name}
        Health Goals: ${healthGoalsStr}
        Restrictions: ${profile.restrictions.join(", ")}

        ${healthDirectives}

        Guidelines:
        1. **Strict Ingredient Usage**: Use the 'AVAILABLE INGREDIENTS'. 
        2. **Main Recipe Compliance**: The GENERATED RECIPE itself MUST BE COMPATIBLE with the user's health goals. Do not generate an unhealthy recipe (like Deep Fried Fritters) if the user wants "Lower Triglycerides". Generate the HEALTHY version as the main output.
        3. **Generic Terms**: If the user provided a generic ingredient (e.g., "Dal", "Flour"), do NOT arbitrarily narrow it down to a specific type (e.g., "Masoor", "All-Purpose") unless absolutely required. 
        4. **Missing Ingredients**: Any ingredient required for the recipe (including oil, salt, water, spices) that is NOT in the 'AVAILABLE INGREDIENTS' list must be added to 'missingIngredients'.
        5. **Flexible Ingredients**: Identify ingredients in the final recipe that are *not strictly required* (e.g., garnish, expensive spices, optional toppings) and list them in 'flexibleIngredients'.
        6. **Healthy Swap**: Since the main recipe should already be healthy, use this section to suggest *even stricter* optimizations or alternatives if they want to go the extra mile (e.g., "Use water sautéing instead of 1 tsp oil").

        Output JSON matching the schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                temperature: 0.7
            }
        });

        if (response.text) {
             const recipe = JSON.parse(response.text) as Recipe;
             recipe.createdAt = new Date().toISOString();
             return recipe;
        }
        throw new Error("No recipe returned");
    } catch (error) {
        console.error("Gemini Recipe Error:", error);
        throw new Error("Failed to generate recipe.");
    }
};

export const analyzeDish = async (
    dishName: string,
    profile: UserProfile
): Promise<Recipe> => {
    const model = "gemini-2.5-flash";
    const prompt = `
        Analyze the dish: "${dishName}".
        
        User Profile:
        Health Goals: ${profile.healthGoals.join(", ")}
        Restrictions: ${profile.restrictions.join(", ")}

        Requirements:
        1. Break down the standard nutrition of this dish.
        2. Create a "Healthy Version" tailored to the user's goals (e.g. lower carb, lower fat).
        3. Explain the swaps made.
        4. Suggest alternative healthy dishes that taste similar.
        5. Leave 'missingIngredients' and 'flexibleIngredients' empty as this is a theoretical analysis.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                temperature: 0.7
            }
        });

        if (response.text) {
             const recipe = JSON.parse(response.text) as Recipe;
             recipe.createdAt = new Date().toISOString();
             return recipe;
        }
        throw new Error("No analysis returned");
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw new Error("Failed to analyze dish.");
    }
};

export const predictDishDetails = async (dishName: string): Promise<DishPrediction> => {
    const model = "gemini-2.5-flash";
    const prompt = `
        Analyze the dish name: "${dishName}".
        Identify the likely core ingredients and standard calories per serving.
        
        Also, identify ambiguity. If the dish is "Pasta", we need to know what kind (Penne, Spaghetti) or what sauce (Marinara, Alfredo).
        Provide "Refinements" which are questions/options to narrow down the specific recipe.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: predictionSchema,
                temperature: 0.3
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as DishPrediction;
        }
        throw new Error("No prediction returned");
    } catch (error) {
        console.error("Gemini Prediction Error:", error);
        throw new Error("Failed to predict dish details.");
    }
};
