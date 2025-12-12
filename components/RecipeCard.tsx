
import React from 'react';
import { Recipe } from '../types';
import { Flame, Activity, ArrowRight, HeartPulse, Scale, ChefHat, Sparkles, ShoppingBag, CheckCircle, Info } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onSelectAlternative: (dishName: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelectAlternative }) => {
  const std = recipe.nutrition.standard;
  const health = recipe.nutrition.healthy;
  const calSaved = Math.max(0, std.calories - health.calories);

  // Helper to check if ingredient is flexible
  const isFlexible = (ingredient: string) => {
      return recipe.flexibleIngredients?.some(flex => ingredient.toLowerCase().includes(flex.toLowerCase()));
  };

  return (
    <div className="space-y-6 pb-20">
        {/* MAIN RECIPE CARD */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-gray-100">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-50 translate-x-10 -translate-y-10"></div>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2 leading-tight">{recipe.recipeName}</h2>
                <p className="opacity-90 text-sm font-medium">{recipe.description}</p>
            </div>
        </div>

        {/* COMPARISON SECTION */}
        <div className="p-6 pb-4 bg-gradient-to-b from-emerald-50 to-white">
            <div className="flex items-center gap-2 mb-4">
                <Scale size={20} className="text-emerald-700" />
                <h3 className="font-bold text-gray-800">Nutrition Comparison</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Standard */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Standard</p>
                    <div className="text-2xl font-bold text-gray-800 mb-1">{std.calories} <span className="text-sm font-normal text-gray-400">kcal</span></div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500"><span>Carbs</span> <span>{std.carbs}</span></div>
                        <div className="flex justify-between text-xs text-gray-500"><span>Protein</span> <span>{std.protein}</span></div>
                        <div className="flex justify-between text-xs text-gray-500"><span>Fat</span> <span>{std.fats}</span></div>
                    </div>
                </div>

                {/* Healthy */}
                <div className="bg-emerald-600 p-4 rounded-xl shadow-lg text-white relative overflow-hidden">
                    {calSaved > 0 && (
                        <div className="absolute top-0 right-0 bg-emerald-500 px-2 py-1 rounded-bl-lg text-[10px] font-bold">
                            Save {calSaved} kcal
                        </div>
                    )}
                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-2">Healthy Swap</p>
                    <div className="text-2xl font-bold text-white mb-1">{health.calories} <span className="text-sm font-normal text-emerald-200">kcal</span></div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-emerald-100/80"><span>Carbs</span> <span>{health.carbs}</span></div>
                        <div className="flex justify-between text-xs text-emerald-100/80"><span>Protein</span> <span>{health.protein}</span></div>
                        <div className="flex justify-between text-xs text-emerald-100/80"><span>Fat</span> <span>{health.fats}</span></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 pt-2 space-y-8">
            {/* Healthy Swaps Section */}
            {recipe.healthySwaps.length > 0 && (
            <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                    <HeartPulse className="text-orange-500" />
                    How to make it healthier
                </h3>
                <div className="space-y-3">
                {recipe.healthySwaps.map((swap, idx) => (
                    <div key={idx} className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <span className="line-through decoration-red-400 decoration-2 opacity-70">{swap.original}</span>
                        <ArrowRight size={14} className="text-gray-400" />
                        <span className="font-bold text-emerald-700">{swap.replacement}</span>
                    </div>
                    <div className="text-xs text-gray-500 italic bg-white px-2 py-1 rounded border border-orange-100">
                        {swap.calorieReduction}
                    </div>
                    </div>
                ))}
                </div>
            </div>
            )}

            {/* MISSING INGREDIENTS ALERT */}
            {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-100 p-5 rounded-2xl">
                    <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <ShoppingBag size={18}/> You'll also need
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {recipe.missingIngredients.map((ing, i) => {
                            const optional = isFlexible(ing);
                            return (
                                <span key={i} className={`px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1 ${optional ? 'bg-white border border-gray-200 text-gray-500' : 'bg-white border border-yellow-200 text-yellow-800'}`}>
                                    {ing}
                                    {optional && <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-500 font-bold ml-1">OPT</span>}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ingredients */}
            <div>
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Ingredients</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recipe.ingredients.map((ing, i) => {
                    const optional = isFlexible(ing);
                    return (
                        <li key={i} className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg text-sm group hover:bg-emerald-50 transition">
                            <div className={`w-1.5 h-1.5 rounded-full ${optional ? 'bg-gray-300' : 'bg-emerald-400 group-hover:bg-emerald-500'}`}></div>
                            {ing}
                            {optional && (
                                <span className="ml-auto text-[10px] font-bold text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">Optional</span>
                            )}
                        </li>
                    );
                })}
            </ul>
            </div>

            {/* Instructions */}
            <div>
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Instructions</h3>
            <div className="space-y-4">
                {recipe.instructions.map((step, i) => (
                <div key={i} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs group-hover:bg-emerald-600 group-hover:text-white transition">
                    {i + 1}
                    </div>
                    <p className="text-gray-700 text-sm mt-0.5 leading-relaxed">{step}</p>
                </div>
                ))}
            </div>
            </div>
        </div>
        </div>

        {/* ALTERNATIVES SECTION */}
        {recipe.alternativeDishes && recipe.alternativeDishes.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-inner">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-500" /> Not what you wanted?
                </h3>
                <p className="text-sm text-blue-700/80 mb-4">
                    Try these other dishes using the same ingredients:
                </p>
                <div className="space-y-3">
                    {recipe.alternativeDishes.map((alt, idx) => (
                        <button 
                            key={idx}
                            onClick={() => onSelectAlternative(alt.name)}
                            className="w-full bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between hover:border-blue-300 hover:shadow-md transition text-left group"
                        >
                            <div>
                                <h4 className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{alt.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{alt.description}</p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-full text-blue-500 group-hover:bg-blue-100 transition">
                                <ChefHat size={18} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default RecipeCard;
