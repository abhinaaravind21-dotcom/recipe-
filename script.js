// ---------- SELECT ELEMENTS ----------
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("search-input");
const resultDiv = document.getElementById("result");

// ---------- ADD RECIPE MODAL ELEMENTS ----------
const openAddBtn = document.getElementById("open-add-btn");
const addModal = document.getElementById("add-modal");
const closeAddBtn = document.getElementById("close-add-btn");
const saveRecipeBtn = document.getElementById("save-recipe-btn");

const addName = document.getElementById("add-name");
const addCategory = document.getElementById("add-category");
const addArea = document.getElementById("add-area");
const addImage = document.getElementById("add-image");
const addIngredients = document.getElementById("add-ingredients");
const addInstructions = document.getElementById("add-instructions");

// ---------- OPEN/CLOSE MODAL ----------
if (openAddBtn && addModal && closeAddBtn) {
  openAddBtn.addEventListener("click", () => {
    addModal.classList.remove("hidden");
  });

  closeAddBtn.addEventListener("click", () => {
    addModal.classList.add("hidden");
    clearAddForm();
  });

  window.addEventListener("click", (e) => {
    if (e.target === addModal) {
      addModal.classList.add("hidden");
      clearAddForm();
    }
  });
}

// ---------- LOCAL STORAGE ----------
const LOCAL_KEY = "my_saved_recipes_v1";

function loadLocalRecipes() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading local recipes", e);
    return [];
  }
}

function saveLocalRecipe(recipe) {
  const list = loadLocalRecipes();
  list.unshift(recipe);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

function removeLocalRecipe(id) {
  const list = loadLocalRecipes().filter((r) => r.id !== id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

// ---------- CLEAR ADD FORM ----------
function clearAddForm() {
  addName.value = "";
  addCategory.value = "";
  addArea.value = "";
  addImage.value = "";
  addIngredients.value = "";
  addInstructions.value = "";
}

// ---------- SAVE NEW RECIPE ----------
if (saveRecipeBtn) {
  saveRecipeBtn.addEventListener("click", () => {
    const name = addName.value.trim();
    if (!name) {
      alert("Please add a recipe name");
      return;
    }

    const recipeObj = {
      id: "local-" + Date.now(),
      strMeal: name,
      strCategory: addCategory.value.trim() || "Other",
      strArea: addArea.value.trim() || "Unknown",
      strMealThumb: addImage.value.trim() || "",
      ingredients: addIngredients.value
        .trim()
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      strInstructions: addInstructions.value.trim() || "No instructions provided.",
      isLocal: true,
    };

    saveLocalRecipe(recipeObj);
    addModal.classList.add("hidden");
    clearAddForm();

    alert("✅ Recipe saved successfully!");
    fetchRecipes(searchInput.value.trim() || "");
  });
}

// ---------- SEARCH FUNCTIONALITY ----------
if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    const q = searchInput.value.trim();
    fetchRecipes(q);
  });
}

async function fetchRecipes(query) {
  resultDiv.innerHTML = "<p>Loading...</p>";
  let apiMeals = [];

  // Fetch from API
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    if (data && data.meals) apiMeals = data.meals.map(convertMealFromAPI);
  } catch (err) {
    console.warn("API fetch failed", err);
  }

  // Local recipes
  const local = loadLocalRecipes();
  const qLower = query.toLowerCase();
  const localMatches = local.filter((r) => {
    if (r.strMeal && r.strMeal.toLowerCase().includes(qLower)) return true;
    if (r.ingredients?.some((ing) => ing.toLowerCase().includes(qLower))) return true;
    if (r.strArea?.toLowerCase().includes(qLower)) return true;
    if (r.strCategory?.toLowerCase().includes(qLower)) return true;
    return false;
  });

  const merged = [
    ...localMatches,
    ...apiMeals.filter((m) => !localMatches.some((l) => l.strMeal === m.strMeal)),
  ];

  if (merged.length === 0) {
    resultDiv.innerHTML = "<p>No recipes found. Try adding your own!</p>";
  } else {
    displayRecipes(merged);
  }
}

// ---------- CONVERT API MEALS ----------
function convertMealFromAPI(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredients.push(`${ing}${measure ? " - " + measure : ""}`);
    }
  }
  return {
    id: meal.idMeal,
    strMeal: meal.strMeal,
    strCategory: meal.strCategory,
    strArea: meal.strArea,
    strMealThumb: meal.strMealThumb,
    ingredients,
    strInstructions: meal.strInstructions,
    isLocal: false,
  };
}

// ---------- DISPLAY RECIPES ----------
function displayRecipes(meals) {
  resultDiv.innerHTML = "";
  meals.forEach((meal) => {
    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe");
    recipeDiv.innerHTML = `
      <img src="${meal.strMealThumb || "https://via.placeholder.com/400x240?text=No+Image"}" 
           alt="${escapeHtml(meal.strMeal)}">
      <h3>${escapeHtml(meal.strMeal)}</h3>
      <p><strong>Category:</strong> ${escapeHtml(meal.strCategory || "")} &nbsp; 
         <strong>Area:</strong> ${escapeHtml(meal.strArea || "")}</p>
      <button class="view-btn" data-id="${meal.id}">View Recipe</button>
      ${meal.isLocal ? `<button class="del-btn" data-id="${meal.id}">Delete</button>` : ""}
    `;
    resultDiv.appendChild(recipeDiv);
  });

  document.querySelectorAll(".view-btn").forEach((b) =>
    b.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const meal = meals.find((m) => String(m.id) === String(id));
      if (meal) showRecipeDetail(meal);
    })
  );

  document.querySelectorAll(".del-btn").forEach((b) =>
    b.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm("Delete this saved recipe?")) {
        removeLocalRecipe(id);
        fetchRecipes(searchInput.value.trim());
      }
    })
  );
}

// ---------- VIEW RECIPE DETAILS ----------
function showRecipeDetail(meal) {
  resultDiv.innerHTML = `
    <h2>${escapeHtml(meal.strMeal)}</h2>
    <img src="${meal.strMealThumb || "https://via.placeholder.com/600x360?text=No+Image"}" 
         alt="${escapeHtml(meal.strMeal)}">
    <p><strong>Category:</strong> ${escapeHtml(meal.strCategory || "")}  
       <strong>Area:</strong> ${escapeHtml(meal.strArea || "")}</p>
    <h3>Ingredients:</h3>
    <ul>${(meal.ingredients || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
    <h3>Instructions:</h3>
    <p>${escapeHtml(meal.strInstructions)}</p>
    <button id="back-to-results">Back</button>
  `;

  document
    .getElementById("back-to-results")
    .addEventListener("click", () => fetchRecipes(searchInput.value.trim()));
}

// ---------- UTILITY ----------
function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
// ---------- ON LOAD WITH DEFAULT INDIAN RECIPES ----------
window.addEventListener("DOMContentLoaded", () => {
  const saved = loadLocalRecipes();

  // Default Indian recipes (only load once if none exist)
  if (saved.length === 0) {
    const defaultRecipes = [
      {
        id: "local-biryani",
        strMeal: "Chicken Biryani",
        strCategory: "Main Course",
        strArea: "Indian",
        strMealThumb: "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/12/chicken-biryani-recipe.jpg",
        ingredients: [
          "Basmati Rice - 2 cups",
          "Chicken - 500g",
          "Yogurt - 1 cup",
          "Biryani Masala - 2 tbsp",
          "Onions - 2 large (fried)",
          "Saffron Milk - 2 tbsp",
          "Mint Leaves - handful",
          "Oil / Ghee - 3 tbsp",
          "Salt - to taste"
        ],
        strInstructions: "Marinate chicken with yogurt and spices for 1 hour. Cook rice until 70% done. In a pot, layer chicken, fried onions, mint, and rice. Sprinkle saffron milk. Cover tightly and cook on low flame for 25 minutes.",
        isLocal: true
      },
      {
        id: "local-paneer",
        strMeal: "Paneer Butter Masala",
        strCategory: "Main Course",
        strArea: "Indian",
        strMealThumb: "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/07/paneer-butter-masala.jpg",
        ingredients: [
          "Paneer - 250g",
          "Butter - 2 tbsp",
          "Tomatoes - 3 pureed",
          "Cream - 2 tbsp",
          "Onion - 1 (chopped)",
          "Garam Masala - 1 tsp",
          "Ginger Garlic Paste - 1 tsp",
          "Salt & Sugar - to taste"
        ],
        strInstructions: "Heat butter and sauté onions until golden. Add ginger-garlic paste, then tomato puree and spices. Cook until thick. Add cream and paneer cubes. Simmer for 5 minutes and serve hot with naan or rice.",
        isLocal: true
      },
      {
        id: "local-mandi",
        strMeal: "Mutton Mandi",
        strCategory: "Main Course",
        strArea: "Arabian / Indian Fusion",
        strMealThumb: "https://www.kitchensofindia.com/wp-content/uploads/2020/09/mutton-mandi.jpg",
        ingredients: [
          "Mutton - 500g",
          "Basmati Rice - 2 cups",
          "Mandi Spice Mix - 2 tbsp",
          "Onion - 1 (sliced)",
          "Garlic - 5 cloves",
          "Ghee - 2 tbsp",
          "Salt - to taste"
        ],
        strInstructions: "Boil mutton with spices until tender. In a large pot, cook mandi masala in ghee, add mutton stock and rice. When rice is 90% cooked, place mutton on top, cover, and steam for 10 minutes.",
        isLocal: true
      },
      {
        id: "local-samosa",
        strMeal: "Aloo Samosa",
        strCategory: "Snack",
        strArea: "Indian",
        strMealThumb: "https://www.vegrecipesofindia.com/wp-content/uploads/2013/09/samosa-recipe-1.jpg",
        ingredients: [
          "All-purpose flour - 2 cups",
          "Potatoes - 3 (boiled & mashed)",
          "Green Peas - 1/2 cup",
          "Spices - cumin, garam masala, chili powder",
          "Oil - for frying"
        ],
        strInstructions: "Prepare dough with flour, oil, and water. Make filling using boiled potatoes and spices. Shape dough into cones, fill with mixture, seal, and deep fry until golden brown.",
        isLocal: true
      },
      {
        id: "local-idli",
        strMeal: "Idli with Sambar",
        strCategory: "Breakfast",
        strArea: "South Indian",
        strMealThumb: "https://www.indianhealthyrecipes.com/wp-content/uploads/2020/01/idli-sambar.jpg",
        ingredients: [
          "Idli Batter - 2 cups",
          "Toor Dal - 1/2 cup",
          "Tamarind - small lemon-sized ball",
          "Mixed Vegetables - 1 cup",
          "Sambar Masala - 2 tbsp"
        ],
        strInstructions: "Steam idlis until fluffy. For sambar, cook toor dal, vegetables, tamarind extract, and masala together until thick. Serve idlis hot with sambar and coconut chutney.",
        isLocal: true
      }
    ];

    // Save defaults into local storage
    defaultRecipes.forEach((r) => saveLocalRecipe(r));
    displayRecipes(defaultRecipes);
  } else {
    // If recipes already saved, show them
    displayRecipes(saved.slice(0, 6));
  }
});
