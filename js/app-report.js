

    // Global variables
    let votesChart;
    let eventData;

    // Load data when page loads
    document.addEventListener('DOMContentLoaded', function() {
      loadEventData();
      loadVotingResults();
    });

    // Load event data from Firestore
    async function loadEventData() {
      try {
        const doc = await db.collection('events').doc(EVENT_ID).get();
        
        if (doc.exists) {
          eventData = doc.data();
          
          // Display event information
          document.getElementById('eventReportTitle').textContent = eventData.eventTitle || 'Event Title';
          
          // Format and display event date in table header
          if (eventData.eventDate) {
            const eventDate = eventData.eventDate.toDate();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('timeSlotHeader').textContent = 
              eventDate.toLocaleDateString('en-US', options);
          }
        } else {
          console.error("Event configuration not found");
        }
      } catch (error) {
        console.error("Error loading event data:", error);
      }
    }

    // Load voting results from Firestore
    async function loadVotingResults() {
      try {
        // First get all time slots from the event
        const eventDoc = await db.collection('events').doc(EVENT_ID).get();
        if (!eventDoc.exists) {
          throw new Error("Event not found");
        }
        
        const eventData = eventDoc.data();
        let timeSlots = eventData.timeSlots || [];
        
        // Sort time slots chronologically by start time
        timeSlots = timeSlots.sort((a, b) => {
          const aStart = a.startTime.toDate().getTime();
          const bStart = b.startTime.toDate().getTime();
          
          // If start times are different, sort by start time
          if (aStart !== bStart) {
            return aStart - bStart;
          }
          
          // If start times are equal, sort by end time
          return a.endTime.toDate().getTime() - b.endTime.toDate().getTime();
        });

        
        // Get all votes for this event
        const votesSnapshot = await db.collection('votes')
          .where('eventId', '==', EVENT_ID)
          .get();
        
        // Initialize vote counts for each formattedTime
        const voteCounts = {};
        timeSlots.forEach(slot => {
          voteCounts[slot.formattedTime] = 0;
        });
        
        // Count votes for each formattedTime
        votesSnapshot.forEach(doc => {
          const vote = doc.data();
          if (vote.formattedTime && voteCounts.hasOwnProperty(vote.formattedTime)) {
            voteCounts[vote.formattedTime]++;
          }
        });
        
        // Convert to array for display (already sorted by time)
        const results = timeSlots.map(slot => ({
          formattedTime: slot.formattedTime,
          count: voteCounts[slot.formattedTime] || 0
        }));
        
        // Find the time slot with the most votes for highlighting
        const maxVotes = Math.max(...results.map(r => r.count));
        
        // Display results in table
        const resultsBody = document.getElementById('resultsBody');
        resultsBody.innerHTML = '';
        
        results.forEach((result, index) => {
          const row = document.createElement('tr');
          if (result.count === maxVotes && maxVotes > 0) {
            row.classList.add('highlight');
          }
          row.innerHTML = `
            <td>${result.formattedTime}</td>
            <td>${result.count}</td>
          `;
          resultsBody.appendChild(row);
        });
        
        // Prepare data for chart
        const labels = results.map(result => result.formattedTime);
        const data = results.map(result => result.count);
        
        // Create or update chart
        renderChart(labels, data);
        
      } catch (error) {
        console.error("Error loading voting results:", error);
      }
    }

    // Render the chart using Chart.js
    function renderChart(labels, data) {
      const ctx = document.getElementById('votesChart').getContext('2d');
      
      // Destroy previous chart if it exists
      if (votesChart) {
        votesChart.destroy();
      }
      
      // Find index of time slot with most votes
      const maxVotesIndex = data.indexOf(Math.max(...data));
      
      votesChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Number of Votes',
            data: data,
            backgroundColor: labels.map((_, i) => 
              i === maxVotesIndex && data[maxVotesIndex] > 0 
                ? 'rgba(255, 107, 53, 0.7)' 
                : 'rgba(0, 95, 135, 0.7)'
            ),
            borderColor: labels.map((_, i) => 
              i === maxVotesIndex && data[maxVotesIndex] > 0
                ? 'rgba(255, 107, 53, 1)' 
                : 'rgba(0, 95, 135, 1)'
            ),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Votes: ${context.raw}`;
                }
              }
            }
          }
        }
      });
    }
