
    // Global variables
    let votingDeadline;
    let votesPerUser = 2;
    let currentStudentId = null;
    let timeSlotsData = []; // Store time slots data for reference

    // Load event configuration when page loads
    document.addEventListener('DOMContentLoaded', function() {
      loadEventConfiguration();
    });

    async function loadEventConfiguration() {
      try {
        const doc = await db.collection('events').doc(EVENT_ID).get();
        
        if (doc.exists) {
          const event = doc.data();
          
          // Display event information
          document.getElementById('eventTitle').textContent = event.eventTitle || 'Event Title';
          
          // Format and display event date
          if (event.eventDate) {
            const eventDate = event.eventDate.toDate();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('eventDate').textContent = eventDate.toLocaleDateString('en-US', options);
          }
          
          // Set voting deadline
          if (event.votingDeadline) {
            votingDeadline = event.votingDeadline.toDate();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            document.getElementById('deadlineNote').textContent = `Voting open until ${votingDeadline.toLocaleDateString('en-US', options)}`;
          }
          
          // Set votes per user
          if (event.votesPerUser) {
            votesPerUser = event.votesPerUser;
            document.getElementById('voteInstructions').textContent = `Please select up to ${votesPerUser} preferred time slots:`;
          }
          
          // Display event description with preserved line breaks
          if (event.eventDescription) {
            document.getElementById('eventDescription').textContent = event.eventDescription;
          }
          
          // Store time slots data for reference
          if (event.timeSlots && event.timeSlots.length > 0) {
            timeSlotsData = event.timeSlots;
            
            // Display time slots
            const timeSlotsContainer = document.getElementById('timeSlotsContainer');
            timeSlotsContainer.innerHTML = '';
            
            event.timeSlots.forEach((slot, index) => {
              const timeOption = document.createElement('label');
              timeOption.className = 'time-option';
              timeOption.innerHTML = `
                <input type="checkbox" name="timeslot" value="${slot.formattedTime}" data-slot-index="${index}">
                ${slot.formattedTime}
              `;
              timeSlotsContainer.appendChild(timeOption);
            });
          }
        } else {
          showError('Event configuration not found');
        }
      } catch (error) {
        console.error("Error loading event configuration:", error);
        showError('Failed to load event information');
      }
    }

    function showError(message) {
      document.getElementById('eventTitle').textContent = message;
    }
    
    function resetVotingSection() {
      // Uncheck all checkboxes
      document.querySelectorAll('input[name="timeslot"]').forEach(input => {
        input.checked = false;
        input.disabled = false;
      });
      
      // Hide error/success messages
      document.getElementById('voteError').style.display = "none";
      document.getElementById('voteSuccess').style.display = "none";
      
      // Show submit button if it was hidden
      document.getElementById('submitVoteBtn').style.display = "block";
    }
    
    async function verifyStudent() {
      const studentId = document.getElementById('studentId').value.trim();
      const errorDiv = document.getElementById('idError');
      const votingSection = document.getElementById('votingSection');
      const findBtn = document.getElementById('findBtn');
      
      // Always reset the voting section when verifying
      resetVotingSection();
      
      if (!studentId) {
        errorDiv.textContent = "Please enter your Student ID.";
        errorDiv.style.display = "block";
        votingSection.style.display = "none";
        return;
      }
      
      // Disable button during verification
      findBtn.disabled = true;
      findBtn.textContent = "Checking...";
      
      try {
        // Check if student exists in Firestore
        const studentDoc = await db.collection('students').doc(studentId).get();
        
        if (!studentDoc.exists) {
          errorDiv.innerHTML = "Student ID not registered yet. Please click <a href='./register.html' class='registration-link'>Registration</a> at the top to register.";
          errorDiv.style.display = "block";
          votingSection.style.display = "none";
          currentStudentId = null;
        } else {
          // Student exists
          errorDiv.style.display = "none";
          votingSection.style.display = "block";
          currentStudentId = studentId;
          
          // Check if student has already voted
          const voteQuery = await db.collection('votes')
            .where('eventId', '==', EVENT_ID)
            .where('studentId', '==', studentId)
            .get();
          
          if (!voteQuery.empty) {
            // Student has already voted - show their previous selections
            const votedTimes = [];
            voteQuery.forEach(doc => {
              votedTimes.push(doc.data().formattedTime);
            });
            
            document.querySelectorAll('input[name="timeslot"]').forEach(input => {
              if (votedTimes.includes(input.value)) {
                input.checked = true;
              }
              input.disabled = true;
            });
            
            document.getElementById('voteSuccess').textContent = "You have already voted. Thank you for your participation!";
            document.getElementById('voteSuccess').style.display = "block";
            document.getElementById('submitVoteBtn').style.display = "none";
          }
        }
      } catch (error) {
        console.error("Error verifying student:", error);
        errorDiv.textContent = "An error occurred while verifying your ID. Please try again.";
        errorDiv.style.display = "block";
        votingSection.style.display = "none";
      } finally {
        // Re-enable button
        findBtn.disabled = false;
        findBtn.textContent = "Find";
      }
    }
    
    async function submitVote() {
      const now = new Date();
      const selectedCheckboxes = document.querySelectorAll('input[name="timeslot"]:checked');
      const errorDiv = document.getElementById('voteError');
      const successDiv = document.getElementById('voteSuccess');
      const submitBtn = document.getElementById('submitVoteBtn');
      
      // Check if voting is closed
      if (now > votingDeadline) {
        errorDiv.textContent = "Voting is now closed. The deadline has passed.";
        errorDiv.style.display = "block";
        return;
      }
      
      // Check if student is verified
      if (!currentStudentId) {
        errorDiv.textContent = "Please verify your student ID first.";
        errorDiv.style.display = "block";
        return;
      }
      
      // Check number of selected slots
      if (selectedCheckboxes.length === 0) {
        errorDiv.textContent = "Please select at least one time slot.";
        errorDiv.style.display = "block";
        return;
      }
      
      if (selectedCheckboxes.length > votesPerUser) {
        errorDiv.textContent = `You may select a maximum of ${votesPerUser} time slots.`;
        errorDiv.style.display = "block";
        return;
      }
      
      // If validation passes
      errorDiv.style.display = "none";
      
      try {
        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
        
        // Create a batch write for all votes
        const batch = db.batch();
        
        // Process each selected time slot
        selectedCheckboxes.forEach(checkbox => {
          const slotIndex = checkbox.dataset.slotIndex;
          const timeSlot = timeSlotsData[slotIndex];
          
          if (timeSlot) {
            const voteRef = db.collection('votes').doc(); // Auto-generated ID
            const voteData = {
              eventId: EVENT_ID,
              studentId: currentStudentId,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
              formattedTime: timeSlot.formattedTime,
              //voteOn: firebase.firestore.FieldValue.serverTimestamp()
              voteOn: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            batch.set(voteRef, voteData);
          }
        });
        
        // Commit the batch write
        await batch.commit();
        
        // Show success message
        successDiv.textContent = "Thank you for voting! Your selections have been recorded.";
        successDiv.style.display = "block";
        
        // Hide the submit button
        submitBtn.style.display = "none";
        
        // Disable form after submission
        document.querySelectorAll('input[name="timeslot"]').forEach(input => {
          input.disabled = true;
        });
      } catch (error) {
        console.error("Error submitting vote:", error);
        errorDiv.textContent = "An error occurred while submitting your vote. Please try again.";
        errorDiv.style.display = "block";
      } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Vote";
      }
    }
