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

// Auto-grow textareas on input
function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
document.querySelectorAll('textarea').forEach(function(ta) {
  ta.addEventListener('input', function() { autoGrow(this); });
});

// Toggle fields based on request type
document.getElementById('request').addEventListener('change', function() {
  var usageNote = document.getElementById('usageNote');
  var requestContent = document.getElementById('requestContent');

  usageNote.classList.toggle('hidden', !!this.value);
  document.getElementById('schedulerReminder').classList.toggle('hidden', this.value !== 'building_access');
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
  var accessInfo = document.getElementById('accessInfo');
  accessInfo.required = this.value && !isLockup;
  var bulkChanges = document.getElementById('bulkChanges');
  var bulkHint = document.getElementById('bulkHint');
  bulkChanges.required = isLockup;
  if (this.value === 'building_lockup') {
    bulkHint.textContent = 'Enter 1 or more: Name, Email, Date Range.';
  } else {
    bulkHint.textContent = 'Enter 1 or more: Name, Email, Calling.';
  }
});

function confirmCancel() {
  var form = document.getElementById('licenseForm');
  var hasInput = form.name.value || form.email.value || form.accessInfo.value;
  if (!hasInput || confirm('Are you sure you want to clear the form?')) {
    form.reset();
    document.getElementById('message').textContent = '';
    document.getElementById('requestContent').classList.add('hidden');
    document.getElementById('usageNote').classList.remove('hidden');
    document.getElementById('schedulerReminder').classList.add('hidden');
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
  if (form.accessInfo.value) form.accessInfo.value = form.accessInfo.value.trim();
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
    data.accessInfo = form.accessInfo.value.trim();
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
    document.getElementById('usageNote').classList.add('hidden');
    document.getElementById('schedulerReminder').classList.add('hidden');
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
    form.request.value = 'building_access';
    form.request.dispatchEvent(new Event('change'));
    form.name.value = 'Peter Wilson - test';
    form.email.value = 'test@gmail.com';
    form.accessInfo.value = '5/2 8am-10am\n5/9 8am-10am\n5/12 6pm-8pm\nPractice Organ';
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
