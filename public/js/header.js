document.addEventListener("DOMContentLoaded", function () {
    // 현재 페이지의 URL에서 파일 이름을 가져옴
    const currentPage = window.location.pathname.split("/").pop();
  
    // 모든 네비게이션 링크 가져오기
    const navLinks = document.querySelectorAll("nav a");
  
    navLinks.forEach(link => {
      const page = link.getAttribute("href");
  
      // 현재 페이지와 링크가 일치하면 active 클래스 추가
      if ('/'+currentPage === page) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  });