document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = {
        ...(await response.json()),
        "Futebol": {
          description: "Participe de partidas amistosas de futebol.",
          schedule: "Segundas e quartas, 16h",
          max_participants: 20,
          participants: [],
        },
        "Vôlei": {
          description: "Treinos e jogos recreativos de vôlei.",
          schedule: "Terças e quintas, 16h",
          max_participants: 16,
          participants: [],
        },
        "Pintura": {
          description: "Explore técnicas de pintura e criatividade.",
          schedule: "Segundas, 15h",
          max_participants: 12,
          participants: [],
        },
        "Teatro": {
          description: "Pratique interpretação, expressão e improvisação.",
          schedule: "Quartas, 15h",
          max_participants: 12,
          participants: [],
        },
        "Clube de xadrez": {
          description: "Desenvolva estratégia em partidas de xadrez.",
          schedule: "Terças, 14h",
          max_participants: 16,
          participants: [],
        },
        "Clube de leitura": {
          description: "Leia e discuta livros com outros estudantes.",
          schedule: "Quintas, 14h",
          max_participants: 14,
          participants: [],
        },
      };

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Validate student is not already signed up
  async function isStudentSignedUp(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/is_signed_up?email=${encodeURIComponent(email)}`
      );
      const result = await response.json();
      return result.signed_up;
    } catch (error) {
      console.error("Error checking if student is signed up:", error);
      return false;
    }
  }



  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
