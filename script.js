const apiKey = "c074d1efc8eec3540b8739cf22d51831"; // replace with your API key using (openweathermap api)
let isCelsius = true;

function showLoading() { document.getElementById("loading").classList.remove("hidden"); }
function hideLoading() { document.getElementById("loading").classList.add("hidden"); }

async function getWeather(cityFromHistory = null) {
  const city = cityFromHistory || document.getElementById("cityInput").value;
  const weatherCard = document.getElementById("weatherResult");
  const forecastBox = document.getElementById("forecastBox");
  const hourlyBox = document.getElementById("hourlyBox");
  const forecastTitle = document.getElementById("forecastTitle");
  const hourlyTitle = document.getElementById("hourlyTitle");
  const error = document.getElementById("errorMessage");

  weatherCard.classList.add("hidden");
  forecastBox.classList.add("hidden");
  hourlyBox.classList.add("hidden");
  forecastTitle.classList.add("hidden");
  hourlyTitle.classList.add("hidden");
  error.classList.add("hidden");

  if (!city || city.trim() === "") {
    error.textContent = "Please enter a city!";
    error.classList.remove("hidden");
    return;
  }

  showLoading();
  const units = isCelsius ? "metric" : "imperial";

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`);
    if (!response.ok) {
      hideLoading();
      error.textContent = response.status === 401 ? "Invalid API key!" : "City not found!";
      error.classList.remove("hidden");
      return;
    }
    const data = await response.json();
    updateWeatherUI(data);
    saveSearchHistory(data.name);
    getForecast(data.coord.lat, data.coord.lon, units);
  } catch(err) {
    hideLoading();
    error.textContent = "Error fetching data.";
    error.classList.remove("hidden");
    console.error(err);
  }
}

function updateWeatherUI(data) {
  document.getElementById("cityName").textContent = data.name;
  document.getElementById("temperature").textContent = `${data.main.temp}°${isCelsius?"C":"F"}`;
  document.getElementById("description").textContent = data.weather[0].description;
  document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
  document.getElementById("wind").textContent = `Wind: ${data.wind.speed} ${isCelsius?"m/s":"mph"}`;
  document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  document.getElementById("weatherResult").classList.remove("hidden");
  updateBackground(data.weather[0].main);
  hideLoading();
}

async function getForecast(lat, lon, units) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`);
    if (!response.ok) throw new Error("Forecast fetch failed");
    const data = await response.json();

    /////////////////////// daily//////////////////////////
    const forecastBox = document.getElementById("forecastBox");
    forecastBox.innerHTML = "";
    const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    daily.forEach(day => {
      const date = new Date(day.dt_txt).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
      forecastBox.innerHTML += `
        <div class="forecast-day">
          <p>${date}</p>
          <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png"/>
          <p>${day.main.temp}°${isCelsius?"C":"F"}</p>
        </div>`;
    });
    document.getElementById("forecastTitle").classList.remove("hidden");
    forecastBox.classList.remove("hidden");

    /////////////////// Hourly//////////////////////////
    const hourlyBox = document.getElementById("hourlyBox");
    hourlyBox.innerHTML = "";
    const nextHours = data.list.slice(0,6);
    nextHours.forEach(hour => {
      const time = new Date(hour.dt_txt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
      hourlyBox.innerHTML += `
        <div class="forecast-day">
          <p>${time}</p>
          <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png"/>
          <p>${hour.main.temp}°${isCelsius?"C":"F"}</p>
        </div>`;
    });
    document.getElementById("hourlyTitle").classList.remove("hidden");
    hourlyBox.classList.remove("hidden");

  } catch(err) {
    hideLoading();
    const error = document.getElementById("errorMessage");
    error.textContent = "Error fetching forecast.";
    error.classList.remove("hidden");
    console.error(err);
  }
}

function getLocationWeather() {
  if (!navigator.geolocation) {
    alert("Your browser does not support geolocation.");
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    success => getWeatherByCoordinates(success.coords.latitude, success.coords.longitude),
    error => { hideLoading(); alert("Failed to get your location."); }
  );
}

async function getWeatherByCoordinates(lat, lon) {
  const units = isCelsius ? "metric" : "imperial";
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`);
    if (!response.ok) throw new Error("Weather fetch failed");
    const data = await response.json();
    updateWeatherUI(data);
    saveSearchHistory(data.name);
    getForecast(lat, lon, units);
    document.getElementById("cityInput").value = data.name;
  } catch(err) {
    hideLoading();
    const error = document.getElementById("errorMessage");
    error.textContent = "Error fetching data.";
    error.classList.remove("hidden");
    console.error(err);
  }
}

function saveSearchHistory(city) {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  if (!history.includes(city)) {
    history.unshift(city);
    if (history.length>10) history.pop();
    localStorage.setItem("history", JSON.stringify(history));
  }
  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  history.forEach(city => {
    const li = document.createElement("li");
    li.textContent = city;
    li.onclick = () => getWeather(city);
    list.appendChild(li);
  });
}
loadHistory();

function toggleTheme() { document.body.classList.toggle("dark-mode"); }
function toggleUnit() { isCelsius = !isCelsius; const city=document.getElementById("cityInput").value; if(city) getWeather(); }

function updateBackground(weatherMain){
  let bg;
  switch(weatherMain.toLowerCase()){
    case "clear": bg="linear-gradient(120deg,#f6d365,#fda085)"; break;
    case "clouds": bg="linear-gradient(120deg,#bdc3c7,#2c3e50)"; break;
    case "rain": bg="linear-gradient(120deg,#4ca1af,#2c3e50)"; break;
    case "snow": bg="linear-gradient(120deg,#e0eafc,#cfdef3)"; break;
    default: bg="linear-gradient(120deg,#4facfe,#00f2fe)";
  }
  document.body.style.background = bg;
}
