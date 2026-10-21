document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  // Results tabs.
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      document.querySelectorAll('.panel').forEach(function (p) {
        p.classList.toggle('is-active', p.id === 'panel-' + tab.dataset.tab);
      });
    });
  });

  // Figure lightbox.
  var box = document.getElementById('lightbox');
  var boxImg = box.querySelector('img');
  document.querySelectorAll('img.zoomable').forEach(function (img) {
    img.addEventListener('click', function () {
      if (typeof box.showModal !== 'function') {
        window.open(img.src, '_blank');
        return;
      }
      boxImg.src = img.src;
      boxImg.alt = img.alt;
      box.showModal();
    });
  });
  box.addEventListener('click', function () { box.close(); });

  // Copy BibTeX.
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = document.querySelector(btn.dataset.copy).textContent;
      var label = btn.querySelector('span');
      navigator.clipboard.writeText(text).then(function () {
        label.textContent = 'Copied';
        setTimeout(function () { label.textContent = 'Copy'; }, 1500);
      }).catch(function () {});
    });
  });
});
