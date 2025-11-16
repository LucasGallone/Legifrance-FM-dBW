const MESSAGES = {
    'fr': {
        // --- TEXTES STATIQUES (index.html) ---
        'appTitle': "📻 Convertisseur de diagrammes FM Légifrance en dBW",
        'introText1': "Cet outil permet de convertir les valeurs de diagrammes de rayonnement d'émetteurs FM, dont les autorisations ont été publiées sur le site Légifrance, au format dBW. Le processus de conversion repose sur une formule de calcul produite par DK2GO.",
        'introText2': "Collez le texte intégral de la décision Légifrance à convertir dans le champ ci-dessous, puis cliquez sur le bouton \"Analyser le texte\".",
        'introText3': "ATTENTION : La copie du texte doit être réalisée en cliquant sur le bouton \"Copier le texte\" en haut à droite de la page de décision Légifrance (À côté du bouton \"Imprimer\"). Ne copiez pas le contenu de la page manuellement ou avec CTRL+A.",
        'inputPlaceholder': "Collez le texte de la décision ici...",
        'analyzeButton': "Analyser le texte",
        
        // --- TEXTES DYNAMIQUES (script.js) ---
        'statusSuccess': "✅ Conversion réalisée avec succès : Les différentes valeurs ont été converties au format dBW.",
        'titleExport': "Texte brut à copier pour l'importation dans la base de données :",
        'buttonCopy': "Copier",
        'copySuccess': "Texte copié !",
        'copyFail': "La copie automatique a échoué. Merci de copier manuellement le contenu.",
        'parReferenceInfo': "💡 Valeur de référence pour la PAR max : {value} dBW",
        
        // Entêtes de tableau
        'colZone': "Zone Géographique",
        'colFrequency': "Fréquence",
        'colAzimuth': "Azimut (degrés)",
        'colAttenuation': "Atténuation (dB)",
        'colConverted': "✅ Valeurs converties en dBW",
        
        // Messages d'erreur
        'errorShortText': "❌ Échec : Le contenu n'a pas pu être traité. Veuillez effectuer un nouveau copier-coller du texte de la décision et recommencer.",
        'errorNoAnnexes': "❌ Échec : Aucune annexe contenant une PAR max n'a été trouvée.",
        'errorDetectionFail': "❌ Échec de la détection : Le tableau de diagramme n'a pas pu être trouvé, ou bien son format est inhabituel.<br>Assurez-vous d'avoir bien ouvert tous les tableaux de la page de décision avant d'avoir effectué la copie du texte.",
        'errorMultipleAnnexes': "Cette décision comporte {count} annexes. Laquelle doit-on traiter ?",
        'buttonProcessAnnex': "Traiter l'annexe sélectionnée",
        'alertSelectAnnex': "Veuillez sélectionner une annexe à traiter.",
        'warningNeant': "⚠️ ATTENTION : Aucun diagramme de rayonnement n'a pu être trouvé pour cette annexe.<br>Le convertisseur utilise une valeur d'atténuation de 0 dB pour tous les azimuts.",
        
    },
    'en': {
        // --- STATIC TEXTS (index.html) ---
        'appTitle': "📻 Légifrance FM diagrams to dBW converter",
        'introText1': "This tool converts radiation pattern diagram values for FM transmitters, whose authorizations were published on the Légifrance website, to dBW format. The conversion process is based on a calculation formula produced by DK2GO.",
        'introText2': "Paste the full text of the Légifrance decision you want to convert into the field below, then click the \"Analyze Text\" button.",
        'introText3': "ATTENTION: The text copy must be performed by clicking the \"Copier le texte\" button at the top right of the Légifrance decision page (Next to the \"Imprimer\" button). Do not manually copy the page content or use CTRL+A.",
        'inputPlaceholder': "Paste the decision text here...",
        'analyzeButton': "Analyze Text",
        
        // --- DYNAMIC TEXTS (script.js) ---
        'statusSuccess': "✅ Conversion successfully completed: All values have been converted to dBW format.",
        'titleExport': "Raw text to copy for database import:",
        'buttonCopy': "Copy",
        'copySuccess': "Text copied!",
        'copyFail': "Automatic copying failed. Please manually copy the content.",
        'parReferenceInfo': "💡 Reference value for max ERP: {value} dBW",
        
        // Table Headers
        'colZone': "Geographical Area",
        'colFrequency': "Frequency",
        'colAzimuth': "Azimuth (degrees)",
        'colAttenuation': "Attenuation (dB)",
        'colConverted': "✅ Values converted to dBW",

        // Error Messages
        'errorShortText': "❌ Failure: Content could not be processed. Please perform a new copy-paste of the text and try again.",
        'errorNoAnnexes': "❌ Failure: No annex containing a max ERP was found.",
        'errorDetectionFail': "❌ Detection failed: The radiation pattern table could not be found, or its format is unusual.<br>Make sure that you have opened all the tables on the decision page before copying the text.",
        'errorMultipleAnnexes': "This decision contains {count} annexes. Which one should be processed?",
        'buttonProcessAnnex': "Process selected annex",
        'alertSelectAnnex': "Please select an annex to process.",
        'warningNeant': "⚠️ WARNING: No radiation pattern diagram could be found for this annex.<br>The converter uses an attenuation value of 0 dB for all azimuths.",
    }

};
