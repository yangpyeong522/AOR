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

    const navContent = document.getElementById('navbarSupportedContent');
    const navbarToggler = document.getElementById('navbarToggler');
    const spanIcon = navbarToggler.querySelector('.navbar-toggler-icon');
    const xIcon = navbarToggler.querySelector('.bi-x');
    console.log("완료")
    // 1) 'hidden.bs.collapse': 메뉴가 접힌 직후 발생 (collapsed 상태)
    navContent.addEventListener('hidden.bs.collapse', () => {
      // 접힌 상태 → span 숨김, X 아이콘 표시
      spanIcon.style.display = 'inline-block';
      xIcon.style.display = 'none';
    });
  
    // 2) 'shown.bs.collapse': 메뉴가 펼쳐진 직후 발생 (expanded 상태)
    navContent.addEventListener('shown.bs.collapse', () => {
      // 펼쳐진 상태 → span 표시, X 아이콘 숨김
      
      spanIcon.style.display = 'none';
      xIcon.style.display = 'inline-block';
    });
  });