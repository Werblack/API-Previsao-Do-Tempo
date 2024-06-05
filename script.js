// Obtenha sua chave da API da OpenWeatherMap (substitua 'SUA_CHAVE_API')
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
const apiForecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
const apiKey = '187ca7cb4ac5f8b036b485082d861b8c'; // Insira sua chave aqui

// Referências aos elementos do DOM
document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.getElementById('search-form');
  const weatherResult = document.getElementById('weather-result');
  const searchCityInput = document.getElementById('search-city');
  const downloadRainingCitiesButton = document.getElementById('download-raining-cities-button');
  const citiesList = document.getElementById('cities-list');
  const rgsWeatherResult = document.getElementById('rgs-weather-result');
  const notification = document.createElement('div'); // Cria um elemento para mostrar mensagens
  notification.classList.add('notification');
  document.body.appendChild(notification);

  // Lista de cidades do Rio Grande do Sul
  const rgsCities = ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Rio Grande', 'Santa Maria', 'Passo Fundo', 'Novo Hamburgo'];

  searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const city = searchCityInput.value.trim(); // Remove espaços em branco no início e no fim
    if (!city) {
      showError('Por favor, insira o nome de uma cidade.');
      return;
    }
    fetchWeatherByCity(city);
  });

  function fetchWeatherByCity(city) {
    fetch(`${apiUrl}?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Cidade não encontrada.');
        }
        return response.json();
      })
      .then(data => displayWeatherData(data, city))
      .catch(error => {
        console.error('Erro ao buscar dados meteorológicos:', error);
        showError('Erro ao buscar dados meteorológicos.');
      });
  }

  function displayWeatherData(data, city) {
    const iconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
    const weatherHtml = `
      <div class="weather-card">
        <h2>${city}</h2>
        <img src="${iconUrl}" alt="Weather Icon">
        <p>Temperatura: ${data.main.temp} °C</p>
        <p>Sensação Térmica: ${data.main.feels_like} °C</p>
        <p>Umidade: ${data.main.humidity}%</p>
        <p>Descrição: ${data.weather[0].description}</p>
      </div>
    `;
    weatherResult.innerHTML = weatherHtml;
  }

  // Função para mostrar mensagem de erro
  function showError(message) {
    notification.textContent = message;
    notification.classList.add('notification-error');
    setTimeout(() => {
      notification.textContent = '';
      notification.classList.remove('notification-error');
    }, 5000); // Remove a mensagem após 5 segundos
  }

  // Função para buscar cidades com chuva no Brasil
  async function getRainingCitiesBrazil() {
    try {
      const response = await fetch(`${apiForecastUrl}?q=Brazil&appid=${apiKey}&units=metric&lang=pt_br`);
      const data = await response.json();
  
      // Filtra cidades com chuva e remove duplicatas
      const rainingCities = data.list.filter(item => {
        // Verifica se a condição meteorológica indica chuva
        return item.weather.some(weather =>
          ['Rain', 'Drizzle', 'Thunderstorm'].includes(weather.main)
        );
      }).map(item => item.name);
  
      if (rainingCities.length > 0) {
        citiesList.innerHTML = rainingCities.map(city => `<li>${city}</li>`).join('');
        downloadRainingCitiesButton.disabled = false;
      } else {
        citiesList.innerHTML = '<li>Nenhuma cidade com chuva encontrada.</li>';
        downloadRainingCitiesButton.disabled = true;
      }
    } catch (error) {
      console.error('Erro ao buscar dados de chuva no Brasil:', error);
      showError('Erro ao buscar dados de chuva no Brasil.');
    }
  }
  
  // Função para gerar o relatório CSV
  function generateRainingCitiesReport() {
  const cities = Array.from(citiesList.querySelectorAll('li')).map(li => li.textContent.trim());
  const csvContent = "data:text/csv;charset=utf-8," + cities.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "cidades_com_chuva.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // Limpa o elemento <a> após o download
}


  // Função para exibir as previsões do tempo para as cidades do Rio Grande do Sul
  function displayRgsWeather() {
    rgsWeatherResult.innerHTML = ''; // Limpa os resultados anteriores
    const promises = rgsCities.map(city => {
      return fetch(`${apiUrl}?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`)
        .then(response => response.json())
        .then(data => {
          const iconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
          const weatherHtml = `
            <div class="weather-card">
              <h2>${city}</h2>
              <img src="${iconUrl}" alt="Weather Icon">
              <p>Temperatura: ${data.main.temp} °C</p>
              <p>Sensação Térmica: ${data.main.feels_like} °C</p>
              <p>Umidade: ${data.main.humidity}%</p>
              <p>Descrição: ${data.weather[0].description}</p>
            </div>
          `;
          rgsWeatherResult.insertAdjacentHTML('beforeend', weatherHtml);
        })
        .catch(error => {
          console.error(`Erro ao buscar dados meteorológicos para ${city}:`, error);
          showError(`Erro ao buscar dados meteorológicos para ${city}.`);
        });
    });

    Promise.all(promises)
      .then(() => {
        console.log('Todas as previsões do tempo foram exibidas com sucesso.');
      })
      .catch(error => {
        console.error('Erro ao exibir as previsões do tempo:', error);
        showError('Erro ao exibir as previsões do tempo.');
      });
  }

  // Chama a função para exibir as previsões do tempo para as cidades do Rio Grande do Sul
  displayRgsWeather();

  // Atualiza as previsões do tempo para as cidades do Rio Grande do Sul a cada 2 minutos
  setInterval(displayRgsWeather, 120000);

  // Atualiza a lista de cidades com chuva a cada 2 minutos
  setInterval(getRainingCitiesBrazil, 120000);

  // Event listener para o botão de download
  downloadRainingCitiesButton.addEventListener('click', () => {
    generateRainingCitiesReport();
  });
});