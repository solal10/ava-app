// Script pour se connecter directement sans passer par l'interface d'authentification
(function() {
  // Créer un token fictif
  const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2MzIxNTQxNjJ9.8h5TbQB0_xnJn8mAIBIm1UC_uqLvY4JUYg9nNGPB38c";
  
  // Créer un utilisateur fictif
  const mockUser = {
    id: "1234567890",
    name: "Utilisateur Test",
    email: "test@test.com",
    isPremium: true, // Utilisateur premium pour accéder à toutes les fonctionnalités
    stats: {
      sommeil: 7,
      hydratation: 1.5,
      stress: 5,
      activite: 45,
      energie: 6
    }
  };
  
  // Stocker le token et l'utilisateur dans localStorage
  localStorage.setItem('auth_token', mockToken);
  localStorage.setItem('user', JSON.stringify(mockUser));
  
  console.log('🔑 Connexion directe réussie ! Vous êtes maintenant connecté en tant qu\'utilisateur test.');
  console.log('👤 Informations utilisateur:', mockUser);
  
  // Rediriger vers la page d'accueil
  window.location.href = '/';
})();
