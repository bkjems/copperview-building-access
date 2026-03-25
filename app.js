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

// Populate time dropdowns
function populateTimeDropdown(selectName) {
  var select = document.querySelector('select[name="' + selectName + '"]');
  for (var h = 6; h <= 23; h++) {
    for (var m = 0; m < 60; m += 30) {
      var h12 = h % 12 || 12;
      var ampm = h >= 12 ? 'PM' : 'AM';
      var label = h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
      var opt = document.createElement('option');
      opt.value = label;
      opt.textContent = (h === 12 && m === 0) ? '12:00 PM (Noon)' : label;
      select.appendChild(opt);
    }
  }
}
populateTimeDropdown('startTime');
populateTimeDropdown('endTime');

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

// Set min date on date fields to today
function setMinDates() {
  var today = new Date().toISOString().split('T')[0];
  document.querySelector('input[name="startDate"]').min = today;
  document.querySelector('input[name="endDate"]').min = today;
}
setMinDates();

function onStartDateChange(form) {
  if (!form.startTime.value) form.startTime.value = '8:00 AM';
  if (!form.endDate.value) {
    form.endDate.value = form.startDate.value;
    if (!form.endTime.value) form.endTime.value = '10:00 PM';
  }
  form.endDate.min = form.startDate.value;
}

function onEndDateChange(form) {
  if (!form.endTime.value) form.endTime.value = '10:00 PM';
}

function confirmCancel() {
  var form = document.getElementById('licenseForm');
  var hasInput = form.name.value || form.email.value || form.purpose.value || form.startDate.value || form.endDate.value;
  if (!hasInput || confirm('Are you sure you want to clear the form?')) {
    form.reset();
    document.getElementById('message').textContent = '';
  }
}

function toggleMode() {
  document.body.classList.toggle('light');
  var btn = document.getElementById('modeToggle');
  btn.innerHTML = document.body.classList.contains('light') ? '&#9789;' : '&#9728;';
}

document.getElementById('licenseForm').addEventListener('submit', function(ev) {
  ev.preventDefault();
  var form = ev.target;

  // Trim whitespace
  form.name.value = form.name.value.trim();
  form.email.value = form.email.value.trim();
  form.purpose.value = form.purpose.value.trim();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  var msg = document.getElementById('message');
  function showError(text) {
    msg.style.color = '#f44336';
    msg.textContent = text;
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var startParts = form.startDate.value.split('-');
  var startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  var endParts = form.endDate.value.split('-');
  var endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  if (startDate < today) {
    showError('Start date cannot be in the past.');
    return;
  }
  if (endDate < today) {
    showError('End date cannot be in the past.');
    return;
  }
  if (endDate < startDate) {
    showError('End date cannot be before start date.');
    return;
  }
  if (startDate.getTime() === endDate.getTime() && form.startTime.value && form.endTime.value) {
    var toMinutes = function(t) {
      var parts = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      var h = parseInt(parts[1]);
      var m = parseInt(parts[2]);
      if (parts[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (parts[3].toUpperCase() === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    if (toMinutes(form.endTime.value) <= toMinutes(form.startTime.value)) {
      showError('End time must be after start time on the same day.');
      return;
    }
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
    endTime: form.endTime.value
  };

  var submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  document.getElementById('message').textContent = '';

  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(JSON.stringify(data))
  })
  .then(function() {
    msg.style.color = '#4caf50';
    msg.textContent = 'Request submitted successfully!';
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
    setTimeout(function() { msg.textContent = ''; }, 7000);
  })
  .catch(function(err) {
    msg.style.color = '#f44336';
    msg.textContent = 'Error: ' + err.message;
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
  });
});
