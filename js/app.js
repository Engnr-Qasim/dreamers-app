// ------------------ Current User ------------------
let currentUser = {};
let currentTheme = "theme-dark1"; // Default theme

// ------------------ Login / Signup ------------------
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async function(e){
  e.preventDefault();

  // Mandatory fields: Name + Location
  const name = document.getElementById('userName').value.trim();
  const location = document.getElementById('userLocation').value.trim();
  if(!name || !location){
    alert("Please provide both Name and Location to continue.");
    return;
  }

  currentUser = {
    name: name,
    email: document.getElementById('userEmail').value.trim(),
    phone: document.getElementById('userPhone').value.trim(),
    location: location,
    desc: ""
  };

  document.getElementById('userDisplayName').textContent = currentUser.name;

  // ---------------- EmailJS: Login Notification ----------------
  try {
    await emailjs.send('service_zp7hxud', 'template_login', {
      from_name: currentUser.name,
      from_email: currentUser.email || "",
      phone: currentUser.phone || "",
      location: currentUser.location
    });
    console.log('✅ Login email sent successfully!');
  } catch (err) {
    console.error('❌ Login email sending failed:', err);
  }

  showScreen('home');
  updateUserDashboard();
});

// Detect user's location
function detectUserLocation(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position){
      const lat = position.coords.latitude.toFixed(6);
      const lon = position.coords.longitude.toFixed(6);
      document.getElementById('userLocation').value = `Lat: ${lat}, Lon: ${lon}`;
    }, function(){
      alert('Location access denied or unavailable.');
    });
  } else {
    alert('Geolocation not supported by your browser.');
  }
}

// ------------------ Navigation ------------------
function showScreen(id) {
  const allowedScreens = ['login'];
  if(!currentUser.name && !allowedScreens.includes(id)) {
    alert("Please login first to access this section.");
    id = 'login';
  }

  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');

  if(id === 'home') updateHomeProgress();
  if(id === 'profile') loadProfile();
}

// ------------------ Helper: Convert file to Base64 ------------------
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// ------------------ Submit Report ------------------
document.getElementById('reportForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  if(!currentUser.name) {
    alert("Please login to submit reports.");
    return;
  }

  const photoFile = document.getElementById('photo').files[0];

  let report = {
    name: currentUser.name,
    email: document.getElementById('reportEmail').value.trim() || currentUser.email || "",
    type: document.getElementById('issueType').value,
    location: document.getElementById('location').value,
    photo: photoFile ? photoFile.name : 'No Photo',
    description: document.getElementById('description').value,
    priority: document.getElementById('priority').value
  };

  // Save to localStorage
  let reports = JSON.parse(localStorage.getItem('dreamersReports')) || [];
  reports.push(report);
  localStorage.setItem('dreamersReports', JSON.stringify(reports));

  // Prepare EmailJS parameters
  let emailParams = {
    from_name: report.name,
    from_email: report.email,
    issue_type: report.type,
    location: report.location,
    description: report.description,
    priority: report.priority
  };

  if(photoFile) {
    const base64Photo = await fileToBase64(photoFile);
    emailParams.attachment = base64Photo;
  }

  // Send via EmailJS
  try {
    await emailjs.send('service_zp7hxud', 'template_9r2yb0h', emailParams);
    console.log('✅ Report email sent successfully!');
  } catch (error) {
    console.error('❌ Report email sending failed:', error);
  }

  document.getElementById('submitMsg').textContent = '✅ Report Submitted Successfully!';
  document.getElementById('reportForm').reset();

  updateHomeProgress();
  updateUserDashboard();
});

// ------------------ Live Location Detection ------------------
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      const lat = position.coords.latitude.toFixed(6);
      const lon = position.coords.longitude.toFixed(6);
      document.getElementById('location').value = `Lat: ${lat}, Lon: ${lon}`;
    }, function() {
      alert('Location access denied or unavailable.');
    });
  } else {
    alert('Geolocation not supported by your browser.');
  }
}

// ------------------ Join Campaign ------------------
async function joinCampaign(campaignName) {
  if(!currentUser.name) {
    alert("Please login first.");
    return;
  }

  let joined = JSON.parse(localStorage.getItem('dreamersCampaigns')) || {};
  if (!joined[currentUser.email]) joined[currentUser.email] = [];
  if (!joined[currentUser.email].includes(campaignName)) joined[currentUser.email].push(campaignName);
  localStorage.setItem('dreamersCampaigns', JSON.stringify(joined));

  // ---------------- EmailJS: Campaign Join ----------------
  try {
    await emailjs.send('service_zp7hxud', 'template_campaign', {
      from_name: currentUser.name,
      from_email: currentUser.email || "",
      campaign_name: campaignName,
      location: currentUser.location
    });
    console.log('✅ Campaign join email sent successfully!');
  } catch (err) {
    console.error('❌ Campaign join email failed:', err);
  }

  alert(`✅ You have joined the "${campaignName}" campaign!`);
  updateHomeProgress();
  updateUserDashboard();
}

// ------------------ Load / Update Profile ------------------
function loadProfile() {
  document.getElementById('profileName').value = currentUser.name;
  document.getElementById('profileEmail').value = currentUser.email || "";
  document.getElementById('profilePhone').value = currentUser.phone || "";
  document.getElementById('profileLocation').value = currentUser.location;
  document.getElementById('profileDesc').value = currentUser.desc || "";
}

// Update profile
document.getElementById('profileForm').addEventListener('submit', function(e){
  e.preventDefault();

  currentUser.name = document.getElementById('profileName').value.trim();
  currentUser.email = document.getElementById('profileEmail').value.trim();
  currentUser.phone = document.getElementById('profilePhone').value.trim();
  currentUser.location = document.getElementById('profileLocation').value.trim();
  currentUser.desc = document.getElementById('profileDesc').value.trim();

  document.getElementById('userDisplayName').textContent = currentUser.name;

  alert("✅ Profile Updated!");
  showScreen('home');
  updateUserDashboard();
});

// Logout button
document.getElementById('logoutBtn').addEventListener('click', function(){
  currentUser = {};
  showScreen('login');
});

// ------------------ Update Home Progress Bars Dynamically ------------------
function updateHomeProgress() {
  const reports = JSON.parse(localStorage.getItem('dreamersReports')) || [];
  const joined = JSON.parse(localStorage.getItem('dreamersCampaigns')) || {};

  const counts = {
    "Tree Plantation": 0,
    "Cleanliness Drives": 0,
    "Dustbin Installation": 0,
    "Awareness Sessions": 0
  };

  reports.forEach(r => { if(counts[r.type] !== undefined) counts[r.type]++; });
  for(let email in joined){
    joined[email].forEach(c=>{ if(counts[c] !== undefined) counts[c]+=0.5; });
  }

  const maxCount = 10;
  document.querySelectorAll('.progress-cards .card').forEach(card => {
    const text = card.textContent;
    let type = "";
    if(text.includes("Tree Plantation")) type = "Tree Plantation";
    else if(text.includes("Cleanliness Drives")) type = "Cleanliness Drives";
    else if(text.includes("Dustbin Installation")) type = "Dustbin Installation";
    else if(text.includes("Awareness Sessions")) type = "Awareness Sessions";

    const percent = Math.min(Math.round((counts[type]/maxCount)*100),100);
    card.querySelector('.progress-bar div').style.width = percent + "%";
    card.querySelector('p').textContent = percent + "% completed";
  });
}

// ------------------ User Dashboard ------------------
function updateUserDashboard() {
  const reports = JSON.parse(localStorage.getItem('dreamersReports')) || [];
  const campaigns = JSON.parse(localStorage.getItem('dreamersCampaigns')) || {};

  let userReports = reports.filter(r => r.name === currentUser.name);
  let userCampaigns = campaigns[currentUser.email] || [];

  document.getElementById('joinedCount').textContent = userCampaigns.length;
  document.getElementById('reportCount').textContent = userReports.length;
}

// ------------------ Theme Switcher ------------------
function switchTheme(theme) {
  document.body.classList.remove("theme-dark1","theme-dark2");
  document.body.classList.add(theme);
  currentTheme = theme;
}

// ------------------ Window Onload ------------------
window.onload = function(){
  showScreen('login');
};

// ------------------ Toggle Media in Activities ------------------
function toggleMedia(card) {
  const media = card.querySelector('.activity-media');
  if(media.style.display === 'block') {
    media.style.display = 'none';
  } else {
    media.style.display = 'block';
  }
}
