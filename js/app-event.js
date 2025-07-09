
    // Initialize Firebase with your config
    /*const firebaseConfig = {
      apiKey: "AIzaSyA0xzbDaEwp9Z6g7TJ24UCXulWtglNQE2o",
      authDomain: "myproject-6e550.firebaseapp.com",
      databaseURL: "https://myproject-6e550-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "myproject-6e550",
      storageBucket: "myproject-6e550.firebasestorage.app",
      messagingSenderId: "513284407464",
      appId: "1:513284407464:web:30873301ebf6a4db94829d"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    const EVENT_ID = "event0"; // Constant for our single event ID
    */
    // DOM elements
    const loginContainer = document.getElementById('loginContainer');
    const eventConfigContainer = document.getElementById('eventConfigContainer');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // Authentication state observer
    auth.onAuthStateChanged(user => {
      if (user) {
        // User is signed in
        showEventConfig();
      } else {
        // No user is signed in
        showLoginForm();
      }
    });

    function showLoginForm() {
      loginContainer.style.display = 'block';
      eventConfigContainer.style.display = 'none';
    }

    function showEventConfig() {
      loginContainer.style.display = 'none';
      eventConfigContainer.style.display = 'block';
      initEventConfig();
    }

    function signOut() {
      auth.signOut().then(() => {
        // Sign-out successful.
      }).catch(error => {
        console.error('Sign out error:', error);
      });
    }

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      loginError.style.display = 'none';
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      
      try {
        await auth.signInWithEmailAndPassword(email, password);
        // Success - auth state observer will handle the UI change
      } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = "Invalid email/password";
        loginError.style.display = 'block';
      }
    });

    // Logout button click
    logoutBtn.addEventListener('click', signOut);

    function initEventConfig() {
      const timeSlotsContainer = document.getElementById('timeSlotsContainer');
      const addTimeSlotBtn = document.getElementById('addTimeSlotBtn');
      const votesPerUserInput = document.getElementById('votesPerUser');
      let slotCount = 0;
      const maxSlots = 5;
      
      // Load existing configuration if it exists
      loadExistingConfiguration();
      
      // Set default dates if not loaded from existing config
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (!document.getElementById('eventDate').value) {
        document.getElementById('eventDate').valueAsDate = today;
      }
      
      if (!document.getElementById('votingDeadline').value) {
        const deadline = new Date(today);
        deadline.setHours(23, 59, 0, 0);
        document.getElementById('votingDeadline').value = deadline.toISOString().slice(0, 16);
      }
      
      // Add first time slot by default if none exist
      if (slotCount === 0) {
        addTimeSlot();
      }
      
      addTimeSlotBtn.addEventListener('click', function() {
        if (slotCount < maxSlots) {
          addTimeSlot();
          validateVotesAgainstSlots();
        } else {
          showAlert('error', `Maximum of ${maxSlots} time slots allowed.`);
        }
      });
      
      votesPerUserInput.addEventListener('input', validateVotesAgainstSlots);
      
      function addTimeSlot(startTime = '09:00', endTime = '10:00') {
        if (slotCount >= maxSlots) return;
        
        slotCount++;
        const slotId = `timeSlot${slotCount}`;
        
        const slotDiv = document.createElement('div');
        slotDiv.className = 'time-slot';
        slotDiv.id = slotId;
        
        slotDiv.innerHTML = `
          <div class="time-input-group">
            <div class="time-input">
              <input type="time" id="startTime${slotCount}" name="startTime${slotCount}" value="${startTime}" required>
              <span class="time-ampm" id="startAmPm${slotCount}">AM</span>
            </div>
            <span class="time-separator">-</span>
            <div class="time-input">
              <input type="time" id="endTime${slotCount}" name="endTime${slotCount}" value="${endTime}" required>
              <span class="time-ampm" id="endAmPm${slotCount}">AM</span>
            </div>
          </div>
          <div class="time-slot-actions">
            <button type="button" class="btn btn-danger btn-sm remove-slot-btn" data-slot="${slotId}">Remove</button>
          </div>
        `;
        
        timeSlotsContainer.appendChild(slotDiv);
        
        // Update AM/PM displays immediately
        updateAmPmDisplay({ target: document.getElementById(`startTime${slotCount}`) });
        updateAmPmDisplay({ target: document.getElementById(`endTime${slotCount}`) });
        
        // Add event listeners for time inputs to update AM/PM display
        document.getElementById(`startTime${slotCount}`).addEventListener('input', updateAmPmDisplay);
        document.getElementById(`endTime${slotCount}`).addEventListener('input', updateAmPmDisplay);
        
        // Add event listener to the remove button
        slotDiv.querySelector('.remove-slot-btn').addEventListener('click', function() {
          timeSlotsContainer.removeChild(slotDiv);
          slotCount--;
          validateVotesAgainstSlots();
          
          // If no slots left, add one automatically
          if (slotCount === 0) {
            addTimeSlot();
          }
        });
      }
      
      function updateAmPmDisplay(e) {
        const timeInput = e.target;
        const timeValue = timeInput.value;
        const inputId = timeInput.id;
        const isStartTime = inputId.startsWith('startTime');
        const amPmSpanId = isStartTime ? inputId.replace('startTime', 'startAmPm') : inputId.replace('endTime', 'endAmPm');
        
        if (timeValue) {
          const [hours] = timeValue.split(':');
          const hourNum = parseInt(hours);
          const amPm = hourNum >= 12 ? 'PM' : 'AM';
          document.getElementById(amPmSpanId).textContent = amPm;
        }
      }
      
      function validateVotesAgainstSlots() {
        const votesPerUser = parseInt(votesPerUserInput.value);
        const currentSlotCount = document.querySelectorAll('.time-slot').length;
        
        if (!isNaN(votesPerUser)) {
          if (votesPerUser > currentSlotCount) {
            votesPerUserInput.setCustomValidity(`Number of votes cannot exceed ${currentSlotCount} (current time slots)`);
            votesPerUserInput.reportValidity();
          } else {
            votesPerUserInput.setCustomValidity('');
          }
        }
      }
      
      function showAlert(type, message) {
        const alertDiv = document.getElementById(`form${type.charAt(0).toUpperCase() + type.slice(1)}`);
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
      }
      
      async function loadExistingConfiguration() {
        try {
          const doc = await db.collection('events').doc(EVENT_ID).get();
          
          if (doc.exists) {
            const data = doc.data();
            
            // Populate form fields
            document.getElementById('eventTitle').value = data.eventTitle || '';
            document.getElementById('eventDescription').value = data.eventDescription || '';
            document.getElementById('votesPerUser').value = data.votesPerUser || 1;
            
            // Set dates
            if (data.eventDate) {
              const eventDate = data.eventDate.toDate();
              document.getElementById('eventDate').valueAsDate = eventDate;
            }
            
            if (data.votingDeadline) {
              const votingDeadline = data.votingDeadline.toDate();
              document.getElementById('votingDeadline').value = votingDeadline.toISOString().slice(0, 16);
            }
            
            // Clear existing time slots
            timeSlotsContainer.innerHTML = '';
            slotCount = 0;
            
            // Add time slots from configuration
            if (data.timeSlots && data.timeSlots.length > 0) {
              data.timeSlots.forEach(slot => {
                const startTime = slot.startTime.toDate();
                const endTime = slot.endTime.toDate();
                
                const startTimeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
                const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
                
                addTimeSlot(startTimeStr, endTimeStr);
              });
            }
          }
        } catch (error) {
          console.error("Error loading configuration:", error);
          showAlert('error', "Failed to load existing configuration");
        }
      }
      
      // Handle form submission
      document.getElementById('eventForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const errorDiv = document.getElementById('formError');
        const successDiv = document.getElementById('formSuccess');
        const form = document.getElementById('eventForm');
        
        // Hide previous messages
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';
        
        // Get form values
        const eventTitle = document.getElementById('eventTitle').value.trim();
        const eventDate = document.getElementById('eventDate').value;
        const votingDeadline = document.getElementById('votingDeadline').value;
        const votesPerUser = parseInt(document.getElementById('votesPerUser').value);
        const eventDescription = document.getElementById('eventDescription').value.trim();
        
        // Collect all time slots
        const timeSlots = [];
        const slotElements = document.querySelectorAll('.time-slot');
        
        slotElements.forEach(slot => {
          const startTime = slot.querySelector('input[type="time"][id^="startTime"]').value;
          const endTime = slot.querySelector('input[type="time"][id^="endTime"]').value;
          
          if (startTime && endTime) {
            const formattedStart = formatTimeToAMPM(startTime);
            const formattedEnd = formatTimeToAMPM(endTime);
            timeSlots.push({
              startTime,
              endTime,
              formattedTime: `${formattedStart} - ${formattedEnd}`
            });
          }
        });
        
        // Validation
        if (!eventTitle || !eventDate || !votingDeadline || isNaN(votesPerUser)) {
          showAlert('error', "Please fill in all required fields.");
          return;
        }
        
        if (timeSlots.length === 0) {
          showAlert('error', "Please add at least one time slot.");
          return;
        }
        
        if (votesPerUser < 1) {
          showAlert('error', "Number of votes per user must be at least 1.");
          return;
        }
        
        if (votesPerUser > timeSlots.length) {
          showAlert('error', `Number of votes per user (${votesPerUser}) cannot exceed the number of time slots (${timeSlots.length}).`);
          return;
        }
        
        // Date validation
        const eventDateObj = new Date(eventDate);
        const votingDeadlineObj = new Date(votingDeadline);
        
        try {
          // Create/update event in Firestore with your specified schema
          const eventData = {
            eventTitle: eventTitle,
            eventDescription: eventDescription,
            eventDate: firebase.firestore.Timestamp.fromDate(new Date(eventDate)),
            votingDeadline: firebase.firestore.Timestamp.fromDate(new Date(votingDeadline)),
            votesPerUser: votesPerUser,
            timeSlots: timeSlots.map(slot => ({
              startTime: convertTimeStringToTimestamp(slot.startTime, eventDate),
              endTime: convertTimeStringToTimestamp(slot.endTime, eventDate),
              formattedTime: slot.formattedTime
            })),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          };
          
          // Set the document with merge: true to update or create
          await db.collection('events').doc(EVENT_ID).set(eventData, { merge: true });
          
          // Clear all votes
          await clearVotes();
          
          // Disable all form fields and buttons
          disableForm();
          
          // Remove all buttons
          const buttons = form.querySelectorAll('button');
          buttons.forEach(button => {
            button.style.display = 'none';
          });
          
          // Show success message (will remain visible permanently)
          showAlert('success', "Event configuration saved successfully and votes have been cleared!");
          
        } catch (error) {
          console.error("Error saving configuration:", error);
          showAlert('error', "Failed to save configuration. Please try again.");
        }
      });
      
      async function clearVotes() {
        try {
          // Get all votes for this event
          const votesSnapshot = await db.collection('votes').where('eventId', '==', EVENT_ID).get();
          
          // Delete each vote
          const batch = db.batch();
          votesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
          console.log("All votes cleared successfully");
        } catch (error) {
          console.error("Error clearing votes:", error);
          throw error;
        }
      }
      
      function disableForm() {
        const form = document.getElementById('eventForm');
        const inputs = form.querySelectorAll('input, textarea, button, select');
        
        inputs.forEach(input => {
          input.disabled = true;
        });
      }
      
      function formatTimeToAMPM(time24h) {
        if (!time24h) return '';
        
        let [hours, minutes] = time24h.split(':');
        hours = parseInt(hours);
        const amPm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${hours.toString().padStart(2, '0')}:${minutes} ${amPm}`;
      }
      
      function convertTimeStringToTimestamp(timeString, dateString) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date(dateString);
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return firebase.firestore.Timestamp.fromDate(date);
      }
    }
  