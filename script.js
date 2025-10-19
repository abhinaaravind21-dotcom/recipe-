const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const resultDiv = document.getElementById('result');

searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (query) {
    fetchRecipes(query);
  }
});

async function fetchRecipes(query) {
  resultDiv.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
    const data = await res.json();
    if (data.meals) {
      displayRecipes(data.meals);
    } else {
      resultDiv.innerHTML = "<p>No recipes found. Try something else!</p>";
    }
  } catch (error) {
    resultDiv.innerHTML = "<p>Something went wrong. Please try again.</p>";
  }
}

function displayRecipes(meals) {
  resultDiv.innerHTML = "";
  meals.forEach(meal => {
    const recipeDiv = document.createElement('div');
    recipeDiv.classList.add('recipe');
    recipeDiv.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>${meal.strMeal}</h3>
      <p><strong>Category:</strong> ${meal.strCategory}</p>
      <button onclick="viewRecipe('${meal.idMeal}')">View Recipe</button>
    `;
    resultDiv.appendChild(recipeDiv);
  });
}

async function viewRecipe(id) {
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const data = await res.json();
  const meal = data.meals[0];
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient) ingredients.push(`${ingredient} - ${measure}`);
  }

  resultDiv.innerHTML = `
    <h2>${meal.strMeal}</h2>
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
    <p><strong>Category:</strong> ${meal.strCategory}</p>
    <p><strong>Area:</strong> ${meal.strArea}</p>
    <h3>Ingredients:</h3>
    <ul>${ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
    <h3>Instructions:</h3>
    <p>${meal.strInstructions}</p>
    <button onclick="window.location.reload()">Back to search</button>
  `;
}
