const fs = require('fs');
const path = require('path');

const LEGAL_DOCS_PATH = path.join(__dirname, '../../legal');

exports.getTerms = async (req, res) => {
  try {
    const termsPath = path.join(LEGAL_DOCS_PATH, 'terms-of-service.md');
    const content = fs.readFileSync(termsPath, 'utf8');
    const stats = fs.statSync(termsPath);
    
    res.status(200).json({
      content,
      lastUpdated: stats.mtime,
      document: 'Conditions Générales d\'Utilisation',
      version: '1.0'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des CGU', 
      error: error.message 
    });
  }
};

exports.getPrivacy = async (req, res) => {
  try {
    const privacyPath = path.join(LEGAL_DOCS_PATH, 'privacy-policy.md');
    const content = fs.readFileSync(privacyPath, 'utf8');
    const stats = fs.statSync(privacyPath);
    
    res.status(200).json({
      content,
      lastUpdated: stats.mtime,
      document: 'Politique de Confidentialité',
      version: '1.0'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de la politique de confidentialité', 
      error: error.message 
    });
  }
};