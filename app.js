var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzFkhiIYgxUqWKyyAwSKcW864MLgczgh_DhDYTtDQKU91tFxVwWSBmPLUDz-B2kWD2O/exec';

// Build ward-to-building map from config
var wardBuildingMap = {};
CONFIG.buildings.forEach(function(b) {
  b.wards.forEach(function(w) {
    wardBuildingMap[w] = b.name;
  });
});

// Populate title
document.getElementById('stakeName').textContent = CONFIG.stakeName;
document.title = CONFIG.stakeName + ' — Temporary Building Access';

// Populate ward dropdown
var wardSelect = document.querySelector('select[name="ward"]');
CONFIG.buildings.forEach(function(b) {
  b.wards.forEach(function(w) {
    var opt = document.createElement('option');
    opt.value = w;
    opt.textContent = w;
    wardSelect.appendChild(opt);
  });
});

// Populate building dropdown
var buildingSelect = document.querySelector('select[name="building"]');
CONFIG.buildings.forEach(function(b) {
  var opt = document.createElement('option');
  opt.value = b.name;
  opt.textContent = b.name;
  buildingSelect.appendChild(opt);
});

function autoSelectBuilding(ward) {
  var building = document.querySelector('select[name="building"]');
  building.value = wardBuildingMap[ward] || "";
}

function toggleMode() {
  document.body.classList.toggle('light');
  var btn = document.getElementById('modeToggle');
  btn.innerHTML = document.body.classList.contains('light') ? '&#9789;' : '&#9728;';
}

document.getElementById('licenseForm').addEventListener('submit', function(ev) {
  ev.preventDefault();
  var form = ev.target;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var startParts = form.startDate.value.split('-');
  var startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  var endParts = form.endDate.value.split('-');
  var endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  if (startDate < today) {
    document.getElementById('message').style.color = '#f44336';
    document.getElementById('message').textContent = 'Start date cannot be in the past.';
    return;
  }
  if (endDate < today) {
    document.getElementById('message').style.color = '#f44336';
    document.getElementById('message').textContent = 'End date cannot be in the past.';
    return;
  }
  if (endDate < startDate) {
    document.getElementById('message').style.color = '#f44336';
    document.getElementById('message').textContent = 'End date cannot be before start date.';
    return;
  }

  var data = {
    ward: form.ward.value,
    building: form.building.value,
    name: form.name.value,
    email: form.email.value,
    purpose: form.purpose.value,
    startDate: form.startDate.value,
    startTime: form.startTime.value,
    endDate: form.endDate.value,
    endTime: form.endTime.value,
    notes: form.notes.value
  };

  document.getElementById('message').textContent = 'Submitting...';
  document.getElementById('message').style.color = '#4caf50';

  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(JSON.stringify(data))
  })
  .then(function() {
    document.getElementById('message').style.color = '#4caf50';
    document.getElementById('message').textContent = 'Request submitted successfully!';
    form.reset();
  })
  .catch(function(err) {
    document.getElementById('message').style.color = '#f44336';
    document.getElementById('message').textContent = 'Error: ' + err.message;
  });
});
