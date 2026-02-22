document.getElementById("myForm").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const formData = {
      name: e.target.name.value,
      age: e.target.age.value,
      email: e.target.email.value,
      password: e.target.password.value,
      phone: e.target.phone.value,
    };
  
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      const result = await response.json();
      console.log(result);
  
      if (response.ok) {
        alert("Registration successful!");
        window.location.href = "registration-success.html";
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to connect to server.");
    }
  });
  