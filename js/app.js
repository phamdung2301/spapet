(function () {
  var data = window.SPAPET_DATA || { services: [], team: [], testimonials: [] };
  function money(n) { return n.toLocaleString("vi-VN") + " đ"; }
  var list = document.getElementById("service-list");
  var countEl = document.getElementById("service-count");
  function renderServices(pet) {
    var shown = data.services.filter(function (s) { return pet === "all" || s.pet.split(",").indexOf(pet) !== -1; });
    if (list) {
      list.innerHTML = shown.map(function (s) {
        return "<article class='card reveal'><h3>" + s.name + "</h3><p>" + s.desc + "</p><p class='price'>Từ " + money(s.price) + "</p><p class='demo-note'>Phù hợp: " + (s.pet === "dog,cat" ? "Chó &amp; mèo" : (s.pet === "dog" ? "Chó" : "Mèo")) + "</p></article>";
      }).join("");
    }
    if (countEl) countEl.textContent = "Đang hiển thị " + shown.length + " / " + data.services.length + " dịch vụ.";
  }
  renderServices("all");
  document.querySelectorAll(".filters .chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filters .chip").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      renderServices(btn.getAttribute("data-pet"));
    });
  });
  var team = document.getElementById("team-list");
  if (team) {
    team.innerHTML = data.team.map(function (t) {
      return "<article class='card'><h3>" + t.name + "</h3><p><strong>" + t.role + "</strong></p><p>" + t.note + "</p></article>";
    }).join("");
  }
  var testi = document.getElementById("testimonial-list");
  if (testi) {
    testi.innerHTML = data.testimonials.map(function (t) {
      return "<article class='card'><p>“" + t.text + "”</p><p><strong>" + t.name + "</strong></p></article>";
    }).join("");
  }
  var calcService = document.getElementById("calc-service");
  var calcSize = document.getElementById("calc-size");
  var calcResult = document.getElementById("calc-result");
  function updateCalc() {
    if (!calcService || !calcResult) return;
    var svc = data.services.find(function (s) { return s.id === calcService.value; }) || data.services[0];
    var mult = parseFloat(calcSize ? calcSize.value : "1");
    if (svc) calcResult.textContent = svc.name + ": " + money(Math.round(svc.price * mult)) + " (giá gốc " + money(svc.price) + " × " + mult + ")";
  }
  if (calcService) {
    calcService.innerHTML = data.services.map(function (s) { return "<option value='" + s.id + "'>" + s.name + "</option>"; }).join("");
    calcService.addEventListener("change", updateCalc);
    if (calcSize) calcSize.addEventListener("change", updateCalc);
    updateCalc();
  }
  var sel = document.getElementById("booking-service");
  if (sel) {
    sel.innerHTML = data.services.map(function (s) {
      return "<option value='" + s.id + "'>" + s.name + " — " + money(s.price) + "</option>";
    }).join("");
  }
  // Scroll reveal, JS-gated only: content stays visible if JS or observer is unavailable.
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in-view"); observer.unobserve(e.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll("section").forEach(function (sec) { sec.classList.add("reveal-init"); observer.observe(sec); });
    // Safety: reveal everything after 3s even if observer stalls.
    setTimeout(function () { document.querySelectorAll(".reveal-init").forEach(function (el) { el.classList.add("in-view"); }); }, 3000);
  }
  var form = document.getElementById("booking-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var out0 = document.getElementById("booking-result");
      if (fd.get("date")) {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var chosen = new Date(fd.get("date") + "T00:00:00");
        if (chosen < today) { if (out0) out0.textContent = "Ngày đã qua — vui lòng chọn ngày từ hôm nay trở đi (demo)."; return; }
      }
      var booking = { pet: fd.get("pet"), service: fd.get("service"), date: fd.get("date"), savedAt: new Date().toISOString() };
      try { localStorage.setItem("spapet-demo-booking", JSON.stringify(booking)); } catch (err) {}
      var out = document.getElementById("booking-result");
      if (out) out.textContent = "Đã lưu demo: " + booking.pet + " — " + booking.date + ". Đây chưa phải lịch hẹn thật.";
    });
  }
})();
