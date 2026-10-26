(function () {
  var data = window.SPAPET_DATA || { services: [], team: [], testimonials: [] };
  function money(n) { return n.toLocaleString("vi-VN") + " đ"; }
  var list = document.getElementById("service-list");
  if (list) {
    list.innerHTML = data.services.map(function (s) {
      return "<article class='card'><h3>" + s.name + "</h3><p>" + s.desc + "</p><p class='price'>Từ " + money(s.price) + "</p></article>";
    }).join("");
  }
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
  var calc = document.getElementById("calculator-box");
  if (calc) {
    calc.innerHTML = "<p>Chọn dịch vụ ở form đặt lịch để xem giá tham khảo. Bảng giá đầy đủ sẽ có ở commit tiếp theo.</p>";
  }
  var sel = document.getElementById("booking-service");
  if (sel) {
    sel.innerHTML = data.services.map(function (s) {
      return "<option value='" + s.id + "'>" + s.name + " — " + money(s.price) + "</option>";
    }).join("");
  }
  var form = document.getElementById("booking-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var booking = { pet: fd.get("pet"), service: fd.get("service"), date: fd.get("date"), savedAt: new Date().toISOString() };
      try { localStorage.setItem("spapet-demo-booking", JSON.stringify(booking)); } catch (err) {}
      var out = document.getElementById("booking-result");
      if (out) out.textContent = "Đã lưu demo: " + booking.pet + " — " + booking.date + ". Đây chưa phải lịch hẹn thật.";
    });
  }
})();
