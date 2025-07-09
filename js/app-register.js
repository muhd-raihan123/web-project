
    document.addEventListener('DOMContentLoaded', function() {
      const form = document.getElementById('registrationForm');
      const submitBtn = document.getElementById('submitBtn');
      
      // Handle form submission
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const errorDiv = document.getElementById('formError');
        const successDiv = document.getElementById('formSuccess');
        
        // Hide previous messages
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';
        
        // Disable submit button during processing
        submitBtn.disabled = true;
        
        // Get form values
        const studentId = document.getElementById('studentId').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const course = document.getElementById('course').value;
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        
        // Basic validation
        if (!studentId || !firstName || !lastName || !course || !email) {
          showAlert('error', "Please fill in all required fields.");
          submitBtn.disabled = false;
          return;
        }
        
        // Validate UTP email format (simple check for @utp.edu.my)
        if (!email.endsWith('@utp.edu.my')) {
          showAlert('error', "Please enter a valid UTP email address (ending with @utp.edu.my).");
          submitBtn.disabled = false;
          return;
        }
        
        try {
          // Check if student ID already exists (using the document ID)
          const studentRef = db.collection('students').doc(studentId);
          const doc = await studentRef.get();
          
          if (doc.exists) {
            showAlert('error', "This Student ID is already registered.");
            submitBtn.disabled = false;
            return;
          }
          
          // Create student data object
          const studentData = {
            studentId: studentId,
            firstName: firstName,
            lastName: lastName,
            course: course,
            phone: phone || null, // Store as null if empty
            email: email,
            registeredAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          
          // Add to Firestore using studentId as document ID
          await studentRef.set(studentData);
          
          // Show success message (permanently)
          showAlert('success', "Registration successful! Thank you for registering.");
          
          // Disable all form fields
          const formElements = form.elements;
          for (let i = 0; i < formElements.length; i++) {
            formElements[i].disabled = true;
          }
          
          // Remove submit button
          submitBtn.style.display = 'none';
          
        } catch (error) {
          console.error("Error registering student:", error);
          showAlert('error', "Failed to register. Please try again.");
          submitBtn.disabled = false;
        }
      });
      
      function showAlert(type, message) {
        const alertDiv = document.getElementById(`form${type.charAt(0).toUpperCase() + type.slice(1)}`);
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
      }
    });