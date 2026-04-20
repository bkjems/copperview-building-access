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

// Populate ward dropdown (sorted)
var wardSelect = document.querySelector('select[name="ward"]');
var allWards = [];
CONFIG.buildings.forEach(function(b) {
  b.wards.forEach(function(w) { allWards.push(w); });
});
allWards.sort(function(a, b) {
  return parseInt(a) - parseInt(b);
});
allWards.forEach(function(w) {
  var opt = document.createElement('option');
  opt.value = w;
  opt.textContent = w;
  wardSelect.appendChild(opt);
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

// Toggle fields based on request type
document.getElementById('request').addEventListener('change', function() {
  var usageNote = document.getElementById('usageNote');
  var requestContent = document.getElementById('requestContent');

  usageNote.classList.toggle('hidden', !!this.value);
  var isLockup = this.value !== 'building_access';
  var nameEmailFields = document.getElementById('nameEmailFields');
  var tempFields = document.getElementById('temporaryFields');
  var lockupFields = document.getElementById('lockupFields');

  requestContent.classList.toggle('hidden', !this.value);

  nameEmailFields.classList.toggle('hidden', isLockup);
  tempFields.classList.toggle('hidden', isLockup);
  lockupFields.classList.toggle('hidden', !isLockup);

  nameEmailFields.querySelectorAll('input').forEach(function(el) {
    el.required = this.value && !isLockup;
  }.bind(this));
  tempFields.querySelectorAll('input, select').forEach(function(el) {
    if (el.name !== 'purpose') el.required = this.value && !isLockup;
  }.bind(this));
  var bulkChanges = document.getElementById('bulkChanges');
  var bulkHint = document.getElementById('bulkHint');
  bulkChanges.required = isLockup;
  if (this.value === 'building_lockup') {
    bulkHint.textContent = 'Enter 1 or more: Name, Email, Date Range.';
  } else {
    bulkHint.textContent = 'Enter 1 or more: Name, Email, Calling.';
  }
});

// Set min date on date fields to today
function setMinDates() {
  var today = new Date().toISOString().split('T')[0];
  document.querySelector('input[name="startDate"]').min = today;
  document.querySelector('input[name="endDate"]').min = today;
}
setMinDates();

var lastStartDate = '';
var lastEndDate = '';

document.querySelector('input[name="startDate"]').addEventListener('blur', function() {
  var form = this.form;
  if (!form.startDate.value || form.startDate.value === lastStartDate) return;
  lastStartDate = form.startDate.value;
  if (!form.startTime.value) form.startTime.value = '8:00 AM';
  form.endDate.min = form.startDate.value;
  if (!form.endDate.value || form.endDate.value < form.startDate.value) {
    form.endDate.value = form.startDate.value;
  }
  if (!form.endTime.value) form.endTime.value = '10:00 PM';
});

document.querySelector('input[name="endDate"]').addEventListener('blur', function() {
  var form = this.form;
  if (!form.endDate.value || form.endDate.value === lastEndDate) return;
  lastEndDate = form.endDate.value;
  if (!form.endTime.value) form.endTime.value = '10:00 PM';
});

function confirmCancel() {
  var form = document.getElementById('licenseForm');
  var hasInput = form.name.value || form.email.value || form.purpose.value || form.startDate.value || form.endDate.value;
  if (!hasInput || confirm('Are you sure you want to clear the form?')) {
    form.reset();
    document.getElementById('message').textContent = '';
    document.getElementById('requestContent').classList.add('hidden');
    document.getElementById('usageNote').classList.remove('hidden');
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
  if (form.purpose.value) form.purpose.value = form.purpose.value.trim();
  if (form.bulkChanges.value) form.bulkChanges.value = form.bulkChanges.value.trim();

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

  var isLockup = form.request.value !== 'building_access';

  if (!isLockup) {
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
  }

  var data = {
    ward: form.ward.value,
    building: form.building.value,
    request: form.request.value,
    name: form.name.value,
    email: form.email.value
  };

  if (isLockup) {
    data.bulkChanges = form.bulkChanges.value.trim();
  } else {
    data.purpose = form.purpose.value;
    data.startDate = form.startDate.value;
    data.startTime = form.startTime.value;
    data.endDate = form.endDate.value;
    data.endTime = form.endTime.value;
  }

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
    document.getElementById('requestContent').classList.add('hidden');
    document.getElementById('usageNote').classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
    setTimeout(function() { msg.textContent = ''; }, 9000);
  })
  .catch(function(err) {
    msg.style.color = '#f44336';
    msg.textContent = 'Error: ' + err.message;
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Request';
  });
});

// Auto-fill form for testing when ?test=<number> is in the URL
var testParam = new URLSearchParams(window.location.search).get('test');
if (testParam) {
  var form = document.getElementById('licenseForm');
  form.ward.value = '8th Ward';
  autoSelectBuilding('8th Ward');

  if (testParam === 'true' || testParam === '1') {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var dateStr = tomorrow.toISOString().split('T')[0];
    form.request.value = 'building_access';
    form.request.dispatchEvent(new Event('change'));
    form.name.value = 'John Test';
    form.email.value = 'test@gmail.com';
    form.startDate.value = dateStr;
    form.startTime.value = '8:00 AM';
    form.endDate.value = dateStr;
    form.endTime.value = '10:00 PM';
    form.purpose.value = 'Testing form submission';
  } else if (testParam === '2') {
    form.request.value = 'building_lockup';
    form.request.dispatchEvent(new Event('change'));
    form.bulkChanges.value = 'John Smith, jsmith@gmail.com 4/24/26 - 4/26/26\nBill Johnson, bjohnson@gmail.com 4/26/26 - 4/28/26\nTim Anderson, tadner@gmail.com 4/28/26 - 4/30/26';
  } else if (testParam === '3') {
    form.request.value = 'custom_callings';
    form.request.dispatchEvent(new Event('change'));
    form.bulkChanges.value = 'Will Smith, wismith@gmail.com Calling 1\nAaron Johnson, aajhnson@gmail.com Activities Committee Chairman\nChad Wilkins, kadner@gmail.com Building Representative';
  }
}
