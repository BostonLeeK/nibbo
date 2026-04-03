"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfWeek } from "date-fns";
import { uk } from "date-fns/locale";
import Link from "next/link";
import { Plus, X, Copy, ClipboardList, ImagePlus, Pencil, Trash2, Eye } from "lucide-react";
import { MEAL_TYPE_CONFIG } from "@/lib/utils";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

function isLocalUpload(src: string | null | undefined) {
  return Boolean(src?.startsWith("/uploads/") || src?.startsWith("/api/recipes/image/"));
}

interface User { id: string; name: string | null; image: string | null; color: string; emoji: string; }
interface Ingredient { id: string; name: string; amount: string; unit: string | null; }
interface Recipe {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  imageUrl: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number;
  category: string;
  ingredients: Ingredient[];
}
interface MealPlan {
  id: string; date: string; mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  recipe: Recipe | null; cook: User | null; note: string | null;
}

interface MealPlannerProps {
  initialRecipes: Recipe[];
  initialMealPlans: MealPlan[];
  users: User[];
  currentUserId: string;
}

type Tab = "planner" | "recipes";

export default function MealPlanner({ initialRecipes, initialMealPlans, users, currentUserId }: MealPlannerProps) {
  const [tab, setTab] = useState<Tab>("planner");
  const [recipes, setRecipes] = useState(initialRecipes);
  const [mealPlans, setMealPlans] = useState(initialMealPlans);
  const [weekStart, setWeekStart] = useState(() => {
    const d = startOfWeek(new Date(), { weekStartsOn: 1 });
    return d;
  });
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopLines, setShopLines] = useState<string[]>([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState<{ date: string; mealType: string } | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [selectedCookId, setSelectedCookId] = useState("");
  const recipeFileRef = useRef<HTMLInputElement>(null);
  const [recipeImageFile, setRecipeImageFile] = useState<File | null>(null);
  const [recipeImagePreview, setRecipeImagePreview] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editInitialImageUrl, setEditInitialImageUrl] = useState<string | null>(null);
  const [viewRecipe, setViewRecipe] = useState<Recipe | null>(null);
  const [mounted, setMounted] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: "", description: "", emoji: "🍽️", category: "Обід",
    prepTime: "", cookTime: "", servings: "4",
    ingredients: [{ name: "", amount: "", unit: "" }],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearBlobOnly = () => {
    if (recipeImagePreview) URL.revokeObjectURL(recipeImagePreview);
    setRecipeImagePreview(null);
    setRecipeImageFile(null);
    if (recipeFileRef.current) recipeFileRef.current.value = "";
  };

  const removeRecipePhoto = () => {
    clearBlobOnly();
    setEditInitialImageUrl(null);
  };

  const openNewRecipeModal = () => {
    setEditingRecipeId(null);
    setEditInitialImageUrl(null);
    clearBlobOnly();
    setNewRecipe({
      name: "",
      description: "",
      emoji: "🍽️",
      category: "Обід",
      prepTime: "",
      cookTime: "",
      servings: "4",
      ingredients: [{ name: "", amount: "", unit: "" }],
    });
    setShowAddRecipe(true);
  };

  const openEditRecipe = (recipe: Recipe) => {
    clearBlobOnly();
    setEditingRecipeId(recipe.id);
    setEditInitialImageUrl(recipe.imageUrl);
    setNewRecipe({
      name: recipe.name,
      description: recipe.description ?? "",
      emoji: recipe.emoji,
      category: recipe.category,
      prepTime: recipe.prepTime != null ? String(recipe.prepTime) : "",
      cookTime: recipe.cookTime != null ? String(recipe.cookTime) : "",
      servings: String(recipe.servings),
      ingredients:
        recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => ({
              name: i.name,
              amount: i.amount,
              unit: i.unit ?? "",
            }))
          : [{ name: "", amount: "", unit: "" }],
    });
    setShowAddRecipe(true);
  };

  const openEditFromView = () => {
    if (!viewRecipe) return;
    const r = viewRecipe;
    setViewRecipe(null);
    openEditRecipe(r);
  };

  const closeAddRecipeModal = () => {
    clearBlobOnly();
    setEditInitialImageUrl(null);
    setEditingRecipeId(null);
    setShowAddRecipe(false);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const mealTypes: ("BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

  const getMealForSlot = (date: Date, mealType: string) =>
    mealPlans.find(
      (p) => format(new Date(p.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd") && p.mealType === mealType
    );

  const handleAddMeal = async () => {
    if (!showAddMeal) return;
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "plan",
        date: new Date(showAddMeal.date).toISOString(),
        mealType: showAddMeal.mealType,
        recipeId: selectedRecipeId || undefined,
        cookId: selectedCookId || undefined,
      }),
    });
    const plan = await res.json();
    setMealPlans((prev) => [...prev, plan]);
    setShowAddMeal(null);
    setSelectedRecipeId("");
    setSelectedCookId("");
    toast.success("Прийом їжі додано! 🍽️");
  };

  const handleDeleteMeal = async (id: string) => {
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    setMealPlans((prev) => prev.filter((p) => p.id !== id));
    toast.success("Видалено");
  };

  const handleSaveRecipe = async () => {
    if (!newRecipe.name) return;
    const ingredientsPayload = newRecipe.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), amount: i.amount.trim(), unit: i.unit.trim() || null }));

    let uploadedUrl: string | undefined;
    if (recipeImageFile) {
      const fd = new FormData();
      fd.append("file", recipeImageFile);
      const up = await fetch("/api/recipes/upload", { method: "POST", body: fd });
      if (!up.ok) {
        const err = await up.json().catch(() => ({}));
        toast.error((err as { error?: string }).error || "Не вдалося завантажити фото");
        return;
      }
      uploadedUrl = ((await up.json()) as { url: string }).url;
    }

    if (editingRecipeId) {
      const imageUrl = uploadedUrl ?? editInitialImageUrl;
      const res = await fetch(`/api/meals/${editingRecipeId}?type=recipe`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRecipe.name,
          description: newRecipe.description || null,
          emoji: newRecipe.emoji,
          category: newRecipe.category,
          prepTime: newRecipe.prepTime ? Number(newRecipe.prepTime) : null,
          cookTime: newRecipe.cookTime ? Number(newRecipe.cookTime) : null,
          servings: Number(newRecipe.servings) || 4,
          imageUrl,
          ingredients: ingredientsPayload,
        }),
      });
      if (!res.ok) {
        toast.error("Не вдалося оновити рецепт");
        return;
      }
      const updated = await res.json();
      setRecipes((prev) => prev.map((r) => (r.id === editingRecipeId ? updated : r)));
      setMealPlans((prev) =>
        prev.map((p) =>
          p.recipe?.id === editingRecipeId ? { ...p, recipe: updated } : p
        )
      );
      closeAddRecipeModal();
      toast.success("Рецепт оновлено");
      return;
    }

    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "recipe",
        name: newRecipe.name,
        description: newRecipe.description,
        emoji: newRecipe.emoji,
        category: newRecipe.category,
        prepTime: newRecipe.prepTime ? Number(newRecipe.prepTime) : null,
        cookTime: newRecipe.cookTime ? Number(newRecipe.cookTime) : null,
        servings: Number(newRecipe.servings),
        ingredients: ingredientsPayload,
        imageUrl: uploadedUrl,
      }),
    });
    if (!res.ok) {
      toast.error("Не вдалося зберегти рецепт");
      return;
    }
    const recipe = await res.json();
    setRecipes((prev) => [...prev, recipe]);
    closeAddRecipeModal();
    toast.success("Рецепт додано! 👨‍🍳");
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    if (
      !confirm(
        `Видалити «${recipe.name}»? Клітинки в тижневому меню з цим рецептом стануть порожніми.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/meals/${recipe.id}?type=recipe`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Не вдалося видалити");
      return;
    }
    setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    setMealPlans((prev) =>
      prev.map((p) => (p.recipe?.id === recipe.id ? { ...p, recipe: null } : p))
    );
    toast.success("Рецепт видалено");
  };

  const openShopFromMenu = () => {
    const raw = mealPlans
      .filter((p) => p.recipe)
      .flatMap((p) =>
        p.recipe!.ingredients.map(
          (i) => `${i.name.trim()} — ${i.amount}${i.unit ? " " + i.unit : ""}`.trim()
        )
      );
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const line of raw) {
      const key = line.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(line);
      }
    }
    if (!unique.length) {
      toast.error("У тижневому меню немає страв з рецептами");
      return;
    }
    setShopLines(unique);
    setShowShopModal(true);
  };

  const copyShopLines = async () => {
    try {
      await navigator.clipboard.writeText(shopLines.join("\n"));
      toast.success("Скопійовано в буфер");
    } catch {
      toast.error("Не вдалося скопіювати");
    }
  };

  const addShopToShoppingLists = async () => {
    setShopLoading(true);
    try {
      const listsRes = await fetch("/api/shopping");
      if (!listsRes.ok) throw new Error();
      let lists: { id: string }[] = await listsRes.json();
      let listId = lists[0]?.id;
      if (!listId) {
        const create = await fetch("/api/shopping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "list", name: "З меню", emoji: "🍽️" }),
        });
        if (!create.ok) throw new Error();
        const list = await create.json();
        listId = list.id;
      }
      for (const line of shopLines) {
        const res = await fetch("/api/shopping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: line,
            listId,
            category: "Інше 📦",
          }),
        });
        if (!res.ok) throw new Error();
      }
      toast.success(`Додано ${shopLines.length} позицій у «Покупки»`);
      setShowShopModal(false);
    } catch {
      toast.error("Не вдалося додати в список");
    } finally {
      setShopLoading(false);
    }
  };

  const FOOD_EMOJIS = ["🍽️", "🥗", "🍝", "🥘", "🍲", "🥩", "🍳", "🥐", "🍕", "🥪", "🍜", "🥑", "🍱", "🥦", "🍰"];
  const CATEGORIES = ["Сніданок", "Обід", "Вечеря", "Перекус", "Суп", "Салат", "Десерт"];
  const renderMealSlot = (day: Date, mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK") => {
    const config = MEAL_TYPE_CONFIG[mealType];
    const meal = getMealForSlot(day, mealType);
    const dateStr = format(day, "yyyy-MM-dd");

    if (meal) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          role={meal.recipe ? "button" : undefined}
          tabIndex={meal.recipe ? 0 : undefined}
          onClick={() => meal.recipe && setViewRecipe(meal.recipe)}
          onKeyDown={(e) => {
            if (!meal.recipe) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setViewRecipe(meal.recipe);
            }
          }}
          className={`${config.color} rounded-2xl p-3 h-full min-h-[80px] relative group border border-warm-100 ${
            meal.recipe ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-peach-400" : ""
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteMeal(meal.id);
            }}
            className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 w-5 h-5 rounded-full bg-white/80 text-warm-400 hover:text-rose-500 flex items-center justify-center transition-all z-20"
          >
            <X size={10} />
          </button>
          {meal.recipe?.imageUrl ? (
            <div className="relative w-full h-12 rounded-xl overflow-hidden mb-1.5 bg-warm-100">
              <Image
                src={meal.recipe.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="120px"
                unoptimized={isLocalUpload(meal.recipe.imageUrl)}
              />
            </div>
          ) : (
            <div className="text-lg mb-1">{meal.recipe?.emoji || "🍽️"}</div>
          )}
          <p className="text-xs font-semibold text-warm-800 leading-tight line-clamp-2">
            {meal.recipe?.name || meal.note || "—"}
          </p>
          {meal.cook && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-white"
                style={{ backgroundColor: meal.cook.color }}>
                {meal.cook.emoji || meal.cook.name?.[0]}
              </div>
              <span className="text-xs text-warm-400 truncate">{meal.cook.name}</span>
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        onClick={() => setShowAddMeal({ date: dateStr, mealType })}
        className="w-full h-full min-h-[80px] rounded-2xl border-2 border-dashed border-warm-200 hover:border-peach-300 hover:bg-peach-50/50 text-warm-300 hover:text-peach-400 flex items-center justify-center transition-all"
      >
        <Plus size={18} />
      </motion.button>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: "planner", label: "Тижневе меню", emoji: "📅" }, { id: "recipes", label: "Рецепти", emoji: "📖" }].map((t) => (
            <motion.button key={t.id} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                tab === t.id ? "bg-white shadow-cozy text-warm-800" : "text-warm-500 hover:bg-white/50"
              }`}>
              <span>{t.emoji}</span> {t.label}
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:flex gap-2">
          {tab === "planner" && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openShopFromMenu}
              title="Зібрати інгредієнти з усіх страв у тижневому плані"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sage-100 hover:bg-sage-200 text-sage-800 rounded-2xl text-sm font-medium transition-all border border-sage-200/60 w-full sm:w-auto"
            >
              <ClipboardList size={16} />
              <span className="hidden sm:inline">Інгредієнти з плану</span>
              <span className="sm:hidden">До покупок</span>
            </motion.button>
          )}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openNewRecipeModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-peach-500 to-peach-400 text-white rounded-2xl text-sm font-medium shadow-cozy w-full sm:w-auto"
          >
            <Plus size={16} /> {tab === "planner" ? "Новий рецепт" : "Новий рецепт"}
          </motion.button>
        </div>
      </div>

      {tab === "planner" ? (
        <div className="flex-1 min-h-0">
          <div className="md:hidden space-y-3 overflow-y-auto pb-2">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="bg-white/70 rounded-3xl border border-warm-100 p-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-warm-800 capitalize">
                    {format(day, "EEEE, d MMMM", { locale: uk })}
                  </p>
                </div>
                <div className="space-y-2">
                  {mealTypes.map((mealType) => {
                    const config = MEAL_TYPE_CONFIG[mealType];
                    return (
                      <div key={mealType} className="grid grid-cols-[84px_1fr] gap-2 items-stretch">
                        <div className={`rounded-2xl px-2 py-3 text-center ${config.color} flex flex-col items-center justify-center`}>
                          <span className="text-lg">{config.emoji}</span>
                          <span className="text-[11px] font-semibold text-warm-600">{config.label}</span>
                        </div>
                        {renderMealSlot(day, mealType)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-auto h-full">
            <div className="min-w-[720px] md:min-w-[800px]">
              <div className="grid grid-cols-8 gap-2 mb-3">
                <div className="text-xs font-semibold text-warm-400 pt-2 pl-2">Прийом їжі</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="text-center">
                    <div className="text-xs text-warm-400 font-medium capitalize">
                      {format(day, "EEE", { locale: uk })}
                    </div>
                    <div className={`text-lg font-bold mt-0.5 ${
                      format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                        ? "text-peach-500" : "text-warm-700"
                    }`}>
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>
              {mealTypes.map((mealType) => {
                const config = MEAL_TYPE_CONFIG[mealType];
                return (
                  <div key={mealType} className="grid grid-cols-8 gap-2 mb-3">
                    <div className={`rounded-2xl p-3 text-center ${config.color} flex flex-col items-center justify-center`}>
                      <span className="text-xl mb-1">{config.emoji}</span>
                      <span className="text-xs font-semibold text-warm-600">{config.label}</span>
                    </div>
                    {weekDays.map((day) => (
                      <div key={`${mealType}-${format(day, "yyyy-MM-dd")}`}>
                        {renderMealSlot(day, mealType)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Recipes grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-auto">
          {recipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white/80 rounded-3xl p-5 shadow-cozy border border-warm-100 relative"
            >
              <div className="absolute top-3 right-3 z-10 flex gap-1">
                <button
                  type="button"
                  onClick={() => setViewRecipe(recipe)}
                  className="w-9 h-9 rounded-xl bg-white/95 shadow-md border border-warm-200 text-warm-600 hover:text-sky-600 flex items-center justify-center"
                  title="Переглянути"
                >
                  <Eye size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => openEditRecipe(recipe)}
                  className="w-9 h-9 rounded-xl bg-white/95 shadow-md border border-warm-200 text-warm-600 hover:text-peach-600 flex items-center justify-center"
                  title="Редагувати"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRecipe(recipe)}
                  className="w-9 h-9 rounded-xl bg-white/95 shadow-md border border-warm-200 text-warm-500 hover:text-rose-600 flex items-center justify-center"
                  title="Видалити"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-warm-100 mb-3">
                {recipe.imageUrl ? (
                  <Image
                    src={recipe.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized={isLocalUpload(recipe.imageUrl)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl">
                    {recipe.emoji}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-warm-800 mb-1">{recipe.name}</h3>
              <p className="text-xs text-warm-400 mb-3 line-clamp-2">{recipe.description}</p>
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="text-xs bg-peach-50 text-peach-600 px-2 py-1 rounded-full">{recipe.category}</span>
                {recipe.prepTime && <span className="text-xs bg-sage-50 text-sage-600 px-2 py-1 rounded-full">⏱ {recipe.prepTime}хв</span>}
                <span className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-full">👥 {recipe.servings}</span>
              </div>
              {recipe.ingredients.length > 0 && (
                <div className="border-t border-warm-100 pt-3">
                  <p className="text-xs font-semibold text-warm-600 mb-2">Інгредієнти:</p>
                  <div className="space-y-1">
                    {recipe.ingredients.slice(0, 3).map((ing) => (
                      <p key={ing.id} className="text-xs text-warm-500">
                        • {ing.name} — {ing.amount}{ing.unit ? " " + ing.unit : ""}
                      </p>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <p className="text-xs text-warm-400">+{recipe.ingredients.length - 3} ще...</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* Add recipe card */}
          <motion.button
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={openNewRecipeModal}
            className="bg-white/40 rounded-3xl p-5 border-2 border-dashed border-warm-200 hover:border-peach-300 text-warm-300 hover:text-peach-400 flex flex-col items-center justify-center gap-2 min-h-[180px] transition-all"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Додати рецепт</span>
          </motion.button>
        </div>
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {showAddMeal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMeal(null)}
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-md max-h-[min(90dvh,640px)] flex flex-col rounded-3xl bg-white shadow-cozy-lg overflow-hidden"
            >
              <div className="overflow-y-auto overscroll-contain p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-warm-800">
                    {showAddMeal && MEAL_TYPE_CONFIG[showAddMeal.mealType as keyof typeof MEAL_TYPE_CONFIG]?.emoji} Додати страву
                  </h2>
                  <button onClick={() => setShowAddMeal(null)} className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <select value={selectedRecipeId} onChange={(e) => setSelectedRecipeId(e.target.value)}
                    className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-peach-400">
                    <option value="">Вибрати рецепт...</option>
                    {recipes.map((r) => <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>)}
                  </select>
                  <select value={selectedCookId} onChange={(e) => setSelectedCookId(e.target.value)}
                    className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-peach-400">
                    <option value="">👩‍🍳 Хто готує?</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.emoji} {u.name}</option>)}
                  </select>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleAddMeal}
                    className="w-full py-3 bg-gradient-to-r from-peach-500 to-peach-400 text-white rounded-2xl font-semibold">
                    Додати 🍽️
                  </motion.button>
                </div>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {viewRecipe && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewRecipe(null)}
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg max-h-[min(92dvh,820px)] flex flex-col rounded-3xl bg-white shadow-cozy-lg overflow-hidden border border-warm-100"
            >
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-warm-100 shrink-0">
                <div className="min-w-0">
                  <p className="text-2xl leading-none mb-1">{viewRecipe.emoji}</p>
                  <h2 className="text-lg font-bold text-warm-800 leading-tight">{viewRecipe.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setViewRecipe(null)}
                  className="shrink-0 w-9 h-9 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain px-5 py-4 flex-1 min-h-0 space-y-4">
                {viewRecipe.imageUrl ? (
                  <div className="relative w-full aspect-[4/3] max-h-56 rounded-2xl overflow-hidden bg-warm-100">
                    <Image
                      src={viewRecipe.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 32rem"
                      unoptimized={isLocalUpload(viewRecipe.imageUrl)}
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-peach-50 text-peach-600 px-2.5 py-1 rounded-full font-medium">{viewRecipe.category}</span>
                  {viewRecipe.prepTime != null && (
                    <span className="text-xs bg-sage-50 text-sage-600 px-2.5 py-1 rounded-full">Підготовка {viewRecipe.prepTime} хв</span>
                  )}
                  {viewRecipe.cookTime != null && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">Готування {viewRecipe.cookTime} хв</span>
                  )}
                  <span className="text-xs bg-sky-50 text-sky-600 px-2.5 py-1 rounded-full">Порцій: {viewRecipe.servings}</span>
                </div>
                {viewRecipe.description?.trim() ? (
                  <div>
                    <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-1.5">Опис</p>
                    <p className="text-sm text-warm-800 whitespace-pre-wrap leading-relaxed">{viewRecipe.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-warm-400 italic">Опис не додано</p>
                )}
                <div>
                  <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-2">Інгредієнти</p>
                  {viewRecipe.ingredients.length > 0 ? (
                    <ul className="space-y-2">
                      {viewRecipe.ingredients.map((ing) => (
                        <li
                          key={ing.id}
                          className="text-sm text-warm-700 py-2 px-3 rounded-xl bg-warm-50 border border-warm-100"
                        >
                          <span className="font-medium text-warm-800">{ing.name}</span>
                          <span className="text-warm-500">
                            {" "}
                            — {ing.amount}
                            {ing.unit ? ` ${ing.unit}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-warm-400">Інгредієнтів немає</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 p-4 border-t border-warm-100 shrink-0 bg-cream-50/50">
                <button
                  type="button"
                  onClick={() => setViewRecipe(null)}
                  className="flex-1 py-3 rounded-2xl bg-white border border-warm-200 text-warm-800 font-medium text-sm"
                >
                  Закрити
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={openEditFromView}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-peach-500 to-peach-400 text-white font-semibold text-sm"
                >
                  Редагувати
                </motion.button>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {showAddRecipe && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddRecipeModal}
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-lg max-h-[min(92dvh,800px)] flex flex-col rounded-3xl bg-white shadow-cozy-lg overflow-hidden"
            >
              <div className="overflow-y-auto overscroll-contain p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-warm-800">
                    {editingRecipeId ? "Редагувати рецепт" : "Новий рецепт"} 👨‍🍳
                  </h2>
                  <button type="button" onClick={closeAddRecipeModal} className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <input
                    ref={recipeFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 5 * 1024 * 1024) {
                        toast.error("Максимум 5 МБ");
                        e.target.value = "";
                        return;
                      }
                      setRecipeImagePreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return URL.createObjectURL(f);
                      });
                      setRecipeImageFile(f);
                    }}
                  />
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <button
                      type="button"
                      onClick={() => recipeFileRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-warm-200 hover:border-peach-300 text-warm-600 text-sm font-medium bg-warm-50/80"
                    >
                      <ImagePlus size={18} />
                      Фото страви
                    </button>
                    {(recipeImagePreview || editInitialImageUrl) && (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-warm-100 shrink-0 border border-warm-200">
                          <Image
                            src={recipeImagePreview || editInitialImageUrl!}
                            alt=""
                            fill
                            unoptimized={!!recipeImagePreview || isLocalUpload(editInitialImageUrl)}
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeRecipePhoto}
                          className="text-xs text-rose-500 font-medium hover:text-rose-600 shrink-0"
                        >
                          Прибрати фото
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {FOOD_EMOJIS.map((e) => (
                      <button key={e} onClick={() => setNewRecipe((p) => ({ ...p, emoji: e }))}
                        className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all ${newRecipe.emoji === e ? "bg-peach-100 ring-2 ring-peach-400" : "hover:bg-warm-50"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <input value={newRecipe.name} onChange={(e) => setNewRecipe((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Назва страви" className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-peach-400" />
                  <textarea value={newRecipe.description} onChange={(e) => setNewRecipe((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Опис (необов'язково)" rows={2}
                    className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-peach-400 resize-none" />
                  <div className="grid grid-cols-3 gap-3">
                    <select value={newRecipe.category} onChange={(e) => setNewRecipe((p) => ({ ...p, category: e.target.value }))}
                      className="bg-warm-50 rounded-xl px-3 py-3 text-sm outline-none border border-warm-200 focus:border-peach-400">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <input type="number" value={newRecipe.prepTime} onChange={(e) => setNewRecipe((p) => ({ ...p, prepTime: e.target.value }))}
                      placeholder="Підготовка (хв)" className="bg-warm-50 rounded-xl px-3 py-3 text-sm outline-none border border-warm-200 focus:border-peach-400" />
                    <input type="number" value={newRecipe.servings} onChange={(e) => setNewRecipe((p) => ({ ...p, servings: e.target.value }))}
                      placeholder="Порцій" className="bg-warm-50 rounded-xl px-3 py-3 text-sm outline-none border border-warm-200 focus:border-peach-400" />
                  </div>

                  {/* Ingredients */}
                  <div>
                    <p className="text-sm font-semibold text-warm-700 mb-2">Інгредієнти</p>
                    {newRecipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input value={ing.name} onChange={(e) => setNewRecipe((p) => ({ ...p, ingredients: p.ingredients.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))}
                          placeholder="Назва" className="flex-1 bg-warm-50 rounded-xl px-3 py-2 text-sm outline-none border border-warm-200 focus:border-peach-400" />
                        <input value={ing.amount} onChange={(e) => setNewRecipe((p) => ({ ...p, ingredients: p.ingredients.map((x, j) => j === i ? { ...x, amount: e.target.value } : x) }))}
                          placeholder="Кількість" className="w-24 bg-warm-50 rounded-xl px-3 py-2 text-sm outline-none border border-warm-200 focus:border-peach-400" />
                        <input value={ing.unit} onChange={(e) => setNewRecipe((p) => ({ ...p, ingredients: p.ingredients.map((x, j) => j === i ? { ...x, unit: e.target.value } : x) }))}
                          placeholder="Од." className="w-16 bg-warm-50 rounded-xl px-3 py-2 text-sm outline-none border border-warm-200 focus:border-peach-400" />
                      </div>
                    ))}
                    <button onClick={() => setNewRecipe((p) => ({ ...p, ingredients: [...p.ingredients, { name: "", amount: "", unit: "" }] }))}
                      className="text-xs text-peach-500 hover:text-peach-600 font-medium">
                      + Додати інгредієнт
                    </button>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveRecipe}
                    className="w-full py-3 bg-gradient-to-r from-peach-500 to-peach-400 text-white rounded-2xl font-semibold"
                  >
                    {editingRecipeId ? "Зберегти зміни" : `Зберегти рецепт ${newRecipe.emoji}`}
                  </motion.button>
                </div>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {mounted && createPortal(
        <AnimatePresence>
          {showShopModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShopModal(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-md max-h-[min(90dvh,720px)] flex flex-col rounded-3xl bg-white shadow-cozy-lg overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 border-b border-warm-100 px-5 py-4 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-warm-800">Інгредієнти з меню</h2>
                  <p className="text-xs text-warm-500 mt-0.5">
                    Усі інгредієнти зі страв у поточному тижневому плані (без дублів)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShopModal(false)}
                  className="shrink-0 w-9 h-9 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
              <ul className="overflow-y-auto overscroll-contain px-5 py-3 space-y-2 flex-1 min-h-0 max-h-[50vh]">
                {shopLines.map((line) => (
                  <li
                    key={line}
                    className="text-sm text-warm-700 py-2 px-3 rounded-xl bg-warm-50 border border-warm-100"
                  >
                    {line}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-warm-100 shrink-0 bg-cream-50/50">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={copyShopLines}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-warm-200 text-warm-800 font-medium text-sm"
                >
                  <Copy size={16} /> Копіювати текст
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  disabled={shopLoading}
                  onClick={addShopToShoppingLists}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sage-500 text-white font-medium text-sm disabled:opacity-60"
                >
                  {shopLoading ? "…" : "У список «Покупки»"}
                </motion.button>
              </div>
              <div className="px-4 pb-4 text-center">
                <Link
                  href="/shopping"
                  className="text-xs text-peach-600 hover:text-peach-700 font-medium"
                  onClick={() => setShowShopModal(false)}
                >
                  Відкрити розділ Покупки →
                </Link>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
