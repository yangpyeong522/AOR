const searchInput = document.getElementById('searchInput');
const suggestionList = document.getElementById('suggestionList');
let debounceTimer;
searchInput.addEventListener('input', async (event) => {
    clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        handleSearch(event);
      }, 300);
});

async function handleSearch(event) {
    const prefix = event.target.value;
    if(!prefix){
        suggestionList.innerHTML = "";
        return;
    }
    try {
        let response = await fetch(`/finder?prefix=${encodeURIComponent(prefix)}`);
        if (!response.ok) throw new Error('네트워크 응답이 정상적이지 않습니다.');
        let results = await response.json();
        console.log(results);
        if(results.length === 0){
            suggestionList.innerHTML = "";
            suggestionList.classList.remove('visible');
            suggestionList.classList.add('hidden');
        }else{
            suggestionList.classList.add('visible');
            suggestionList.classList.remove('hidden');
            suggestionList.innerHTML = "";
            results.forEach(problem => {
              const a = document.createElement('a');
              a.href = '#';
              a.className = 'list-group-item list-group-item-action';
              a.textContent = problem + " 문제";
              a.href="/comment/" + problem;
              a.addEventListener('click', () => {
                searchInput.value = problem;
                suggestionList.innerHTML = "";
              });
              suggestionList.appendChild(a);
            });
        }
      } catch (error) {
        console.error('검색 결과를 가져오는 중 오류 발생:', error);
      }
}
document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-container')) {
      suggestionList.innerHTML = "";
      suggestionList.classList.remove('visible');
      suggestionList.classList.add('hidden');
    }
  });

  searchInput.addEventListener('focus', () => {
    handleSearch({ target: searchInput });
  });