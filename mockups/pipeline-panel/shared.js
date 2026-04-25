/**
 * Minimal JS for mockup interactivity.
 * Only simulates state toggles - no real logic.
 */

document.addEventListener('DOMContentLoaded', function () {
  // Toggle error details
  document.querySelectorAll('.error-detail-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var detail = btn.nextElementSibling;
      if (!detail) return;
      var isVisible = detail.classList.contains('visible');
      detail.classList.toggle('visible');
      btn.textContent = isVisible ? 'Ver detalhes tecnicos' : 'Ocultar detalhes';
      btn.setAttribute('aria-expanded', String(!isVisible));
    });
  });

  // Toggle iteration group collapse
  document.querySelectorAll('[data-toggle-group]').forEach(function (header) {
    header.style.cursor = 'pointer';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');

    var targetId = header.getAttribute('data-toggle-group');
    var target = document.getElementById(targetId);
    if (!target) return;

    header.setAttribute('aria-expanded', target.style.display !== 'none' ? 'true' : 'false');

    function toggle() {
      var isHidden = target.style.display === 'none';
      target.style.display = isHidden ? 'block' : 'none';
      header.setAttribute('aria-expanded', String(isHidden));
    }

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
});
