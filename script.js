// Variable globale pour stocker les métadonnées des annexes trouvées
let ANNEXES_META = [];
const LOG_BASE_10 = Math.log(10); 

// --- Fonctions utilitaires ---
function nettoyerTexte(texte) {
    let cleaned = texte.replace(/\r\n|\r/g, '\n'); 
    cleaned = cleaned.replace(/[\t\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' '); 
    cleaned = cleaned.replace(/[\x00-\x08\x0B\uFEFF\u200B]/g, ''); 
    return cleaned;
}

function convertirEnDBW(attenuation, maxERP) {
    if (isNaN(attenuation) || isNaN(maxERP)) {
        return NaN;
    }
    const result = maxERP - attenuation;
    return parseFloat(result.toFixed(1)); 
}

function extraireMaxERP(blocTexte) {
    const regex = /Puissance apparente rayonnée \(PAR max\.\)\s*:\s*(\d+[\.,]\d*|\d+)\s*(kW|W|dBW)/i;
    const match = blocTexte.match(regex);
    
    if (match) {
        let valeur = parseFloat(match[1].replace(',', '.')); 
        const unite = match[2].toLowerCase();                  
        let dBW;
        
        if (valeur === 0) {
            dBW = -Infinity;
        } else if (unite === 'kw') {
            dBW = (10 * Math.log(valeur) / LOG_BASE_10 + 30);
        } else if (unite === 'w') {
            // Calcul de la PAR sans arrondi
            dBW = (10 * Math.log(valeur) / LOG_BASE_10);
        } else if (unite === 'dbw') {
            dBW = valeur;
        } else {
            return null;
        }

        return { 
            value: dBW,
            text: match[0].trim() 
        };
    }
    return null;
}

function extraireMetaData(blocTexte) {
    const nomServiceMatch = blocTexte.match(/Nom du service\s*:\s*(.+?)\./i);
    const zoneMatch = blocTexte.match(/Zone géographique mise en appel\s*:\s*(.+?)\./i);
    const frequenceMatch = blocTexte.match(/Fréquence\s*:\s*(\d+[\.,]\d*)\s*MHz/i);
    const parMaxTextMatch = blocTexte.match(/Puissance apparente rayonnée \(PAR max\.\)\s*:\s*(.+?)\./i);
    
    const maxERPData = extraireMaxERP(blocTexte); 

    if (!maxERPData) {
        return null; 
    }
    
    let frequence = frequenceMatch ? frequenceMatch[1].replace(',', '.') + ' MHz' : 'N/A';
    let parMaxText = parMaxTextMatch ? parMaxTextMatch[1].trim() : maxERPData.text.split(':')[1].trim(); 

    return {
        nomService: nomServiceMatch ? nomServiceMatch[1].trim() : 'N/A',
        zone: zoneMatch ? zoneMatch[1].trim() : 'N/A',
        frequence: frequence,
        maxERPValue: maxERPData.value,
        parMaxText: parMaxText,
        fullText: blocTexte 
    };
}

function genererChaineTexteCompacte(tousLesResultats) {
    const pointsMap = new Map();
    tousLesResultats.forEach(data => pointsMap.set(data.azimut, data)); 

    let chaine = [];
    
    const LONGUEUR_CIBLE = 5; 

    for (let azimut = 0; azimut < 360; azimut += 10) {
        let erp_dbw_non_arrondi;
        
        if (pointsMap.has(azimut)) {
            const data = pointsMap.get(azimut);
            erp_dbw_non_arrondi = data.maxERP - data.attenuation;
        } else {
            erp_dbw_non_arrondi = 0; 
        }

        // 1. Arrondi à la première décimale (ex: 14.45 -> 14.5)
        const erp_decimal_str = erp_dbw_non_arrondi.toFixed(1);
        
        // 2. Remplacement du point par la virgule (X,X)
        let erp_formatte = erp_decimal_str.replace('.', ',');
        
        const estNegatif = erp_formatte.startsWith('-');

        if (estNegatif) {
            let valeurAbsoluePaddee = erp_formatte.substring(1).padStart(LONGUEUR_CIBLE - 1, '0');
            erp_formatte = '-' + valeurAbsoluePaddee;
            
        } else {
            erp_formatte = erp_formatte.padStart(LONGUEUR_CIBLE, '0');
        }

        chaine.push(erp_formatte);
    }
    
    return chaine.join('');
}

function extraireDonneesEtCompleter(blocTexte, meta) {
    const maxERPValue = meta.maxERPValue;
    const zone = meta.zone;
    const frequence = meta.frequence;

    let lignes = blocTexte.split('\n'); 
    let debutAnalyseIndex = -1;

    for (let i = 0; i < lignes.length; i++) {
        if (lignes[i].includes('Puissance apparente rayonnée (PAR max.)')) {
            debutAnalyseIndex = i + 1; 
            break;
        }
    }
    
    if (debutAnalyseIndex === -1) return [];
    
    let blocDonneesTexte = lignes.slice(debutAnalyseIndex).join('\n');
    
    // Gérer le cas "Limitation du rayonnement : néant"
    if (blocDonneesTexte.toLowerCase().includes('néant')) {
        const donneesResultat = [];
        for (let azimut = 0; azimut < 360; azimut += 10) {
            donneesResultat.push({ 
                azimut: azimut, 
                attenuation: 0, 
                maxERP: maxERPValue,
                zone: zone, 
                frequence: frequence,
                is_neant: true 
            });
        }
        return donneesResultat;
    }

    blocDonneesTexte = blocDonneesTexte.replace(/Azimut\s*\(degrés\)/gi, '');
    blocDonneesTexte = blocDonneesTexte.replace(/Atténuation\s*\(dB\)\s*\(\d+\)/gi, ''); 
    blocDonneesTexte = blocDonneesTexte.replace(/\(\d+\)/g, ''); 
    blocDonneesTexte = blocDonneesTexte.replace(/[^a-zA-Z0-9\s\.,]/g, ' '); 
    blocDonneesTexte = blocDonneesTexte.replace(/\s+/g, ' ').trim(); 

    const regexNombres = /(\d+([\.,]\d+)?)/g;
    
    let tousLesNombres = [];
    let match;
    
    while ((match = regexNombres.exec(blocDonneesTexte)) !== null) {
        tousLesNombres.push(match[1].replace(',', '.')); 
    }

    // Traitement des données par paires (Azimut, Attenuation)
    const donneesResultat = [];

    for (let i = 0; i < tousLesNombres.length; i += 2) {
        const azimutStr = tousLesNombres[i];
        const attenuationStr = tousLesNombres[i + 1];
        
        if (azimutStr && attenuationStr) {
            const azimut = parseInt(azimutStr);
            const attenuation = parseFloat(attenuationStr);
            
            if (!isNaN(azimut) && azimut >= 0 && azimut < 360 && azimut % 10 === 0 && !isNaN(attenuation)) {
                donneesResultat.push({ 
                    azimut: azimut, 
                    attenuation: attenuation,
                    maxERP: maxERPValue,
                    zone: zone, 
                    frequence: frequence,
                    is_neant: false 
                });
            }
        }
    }
    return donneesResultat;
}

// Fonction utilitaire pour générer le message d'alerte "Limitation du rayonnement : néant"
function genererMessageAttentuationZero(tousLesResultats) {
    if (tousLesResultats.length === 0) return '';
    
    const isNeantCase = tousLesResultats.every(data => data.is_neant === true);

    if (isNeantCase) {
        return `
            <p style="color: #856404; background-color: #fff3cd; border: 1px solid #ffeeba; padding: 10px; border-radius: 4px; font-weight: bold;">
                ⚠️ ATTENTION : Aucun diagramme de rayonnement n'a pu être trouvé pour cette annexe.
				<br>
				Le convertisseur utilise une valeur d'atténuation de 0 dB pour tous les azimuts.
            </p>
        `;
    }
    return '';
}

// Fonction pour copier le texte de sortie dans le presse-papiers
function copierTexteDeSortie() {
    const outputTextarea = document.getElementById('output-text');
    const statusMessage = document.getElementById('copy-status-message');
    
    if (outputTextarea && statusMessage) {
        outputTextarea.select(); 
        outputTextarea.setSelectionRange(0, 99999); 
        
        navigator.clipboard.writeText(outputTextarea.value)
            .then(() => {
                // Succès : Affichage du message de succès
                statusMessage.textContent = 'Texte copié !';
                statusMessage.style.color = '#155724';
                statusMessage.style.fontWeight = 'bold';
                
                // Effacement du message après 2 secondes
                setTimeout(() => {
                    statusMessage.textContent = '';
                    statusMessage.style.color = 'initial';
                    statusMessage.style.fontWeight = 'initial';
                }, 2000);
            })
            .catch(err => {
                // Échec : Gestion de l'erreur
                console.error('Erreur de copie:', err);
                statusMessage.textContent = 'La copie automatique a échoué. Merci de copier manuellement le contenu.';
                statusMessage.style.color = 'red';
                setTimeout(() => {
                    statusMessage.textContent = '';
                    statusMessage.style.color = 'initial';
                }, 5000); // Temps étendu pour le message d'erreur
            });
    }
}

function traiterResultats(tousLesResultats, nombreBlocsTraites) {
    const statutMessage = document.getElementById('statut-message');
    const resultatsSection = document.getElementById('resultats');
    const tableContainer = document.getElementById('tableau-converti-container');
    const exportTextContainer = document.getElementById('export-text-container');

    tableContainer.innerHTML = '';
    
    // Message de succès pour la conversion
    statutMessage.textContent = `✅ Conversion réalisée avec succès : Les différentes valeurs ont été converties au format dBW.`;

    const messageAlerte = genererMessageAttentuationZero(tousLesResultats);

    const chaineCompacte = genererChaineTexteCompacte(tousLesResultats);
    
    // --- Affichage du texte brut et du bouton de copie ---
    exportTextContainer.innerHTML = `
        <h3 style="display: flex; align-items: center; justify-content: space-between;">
            <span>Texte brut à copier pour l'importation dans la base de données :</span>
            <span id="copy-status-message" style="font-size: 0.9em;"></span>
        </h3>
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <textarea id="output-text" rows="3" readonly style="width: 100%; font-family: monospace; cursor: copy; margin-right: 10px;" onclick="this.select();">${chaineCompacte}</textarea>
            <button type="button" onclick="copierTexteDeSortie()" class="bouton-principal" style="flex-shrink: 0; padding: 10px 15px; background-color: #007bff; color: white;">
                Copier
            </button>
        </div>
    `;

    // --- Extraction et affichage de la valeur de référence en dBW ---
    let parMaxInfo = '';
    if (tousLesResultats.length > 0) {
        const maxERP_Value = tousLesResultats[0].maxERP;
        const maxERP_Affiche = maxERP_Value.toFixed(2).replace('.', ','); 
        parMaxInfo = `<p style="font-weight: bold; margin-bottom: 10px;">💡 Valeur de référence pour la PAR max : ${maxERP_Affiche} dBW</p>`;
    }

    // --- Affichage du tableau de vérification ---
    let htmlTable = parMaxInfo + messageAlerte + '<table>'; 
    htmlTable += '<thead><tr><th>Zone Géographique</th><th>Fréquence</th><th>Azimut (degrés)</th><th>Atténuation (dB)</th><th>✅ Valeurs converties en dBW</th></tr></thead><tbody>';
    
    const donneesTrieesPourTableau = tousLesResultats.sort((a, b) => a.azimut - b.azimut);
    
    donneesTrieesPourTableau.forEach(data => {
        const valeurConvertie = convertirEnDBW(data.attenuation, data.maxERP);
        
        htmlTable += '<tr>';
        htmlTable += `<td>${data.zone}</td>`;
        htmlTable += `<td>${data.frequence}</td>`;
        htmlTable += `<td>${data.azimut}</td>`;
        htmlTable += `<td>${data.attenuation}</td>`;
        htmlTable += `<td>${String(valeurConvertie).replace('.', ',')}</td>`; 
        htmlTable += '</tr>';
    });
    
    htmlTable += '</tbody></table>';

    tableContainer.innerHTML = htmlTable;
    resultatsSection.style.display = 'block';
}

function afficherSelectionAnnexe(annexes) {
    const statutMessage = document.getElementById('statut-message');
    const resultatsSection = document.getElementById('resultats');
    const tableContainer = document.getElementById('tableau-converti-container');
    const exportTextContainer = document.getElementById('export-text-container');
    
    tableContainer.innerHTML = '';
    exportTextContainer.innerHTML = ''; 

    statutMessage.innerHTML = `
        <h3 style="color: #007bff;">Cette décision comporte ${annexes.length} annexes. Laquelle doit-on traiter ?</h3>
    `;

    // Table des chiffres Romains afin de traiter jusqu'à 100 annexes par décision
    const chiffresRomains = [
        'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 
        'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
        'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
        'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII', 'XXXVIII', 'XXXIX', 'XL',
        'XLI', 'XLII', 'XLIII', 'XLIV', 'XLV', 'XLVI', 'XLVII', 'XLVIII', 'XLIX', 'L',
        'LI', 'LII', 'LIII', 'LIV', 'LV', 'LVI', 'LVII', 'LVIII', 'LIX', 'LX',
        'LXI', 'LXII', 'LXIII', 'LXIV', 'LXV', 'LXVI', 'LXVII', 'LXVIII', 'LXIX', 'LXX',
        'LXXI', 'LXXII', 'LXXIII', 'LXXIV', 'LXXV', 'LXXVI', 'LXXVII', 'LXXVIII', 'LXXIX', 'LXXX',
        'LXXXI', 'LXXXII', 'LXXXIII', 'LXXXIV', 'LXXXV', 'LXXXVI', 'LXXXVII', 'LXXXVIII', 'LXXXIX', 'XC',
        'XCI', 'XCII', 'XCIII', 'XCIV', 'XCV', 'XCVI', 'XCVII', 'XCVIII', 'XCIX', 'C'
    ];

    let selectionHTML = '<form id="form-selection-annexe">';
    annexes.forEach((meta, index) => {
        const parAffichee = meta.parMaxText.replace('.', ','); 
        
        const annexeRomain = chiffresRomains[index] || `(${index + 1})`;

        selectionHTML += `
            <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                <input type="radio" id="annexe-${index}" name="annexe-select" value="${index}" required>
                <label for="annexe-${index}">
                    <strong>ANNEXE ${annexeRomain} : </strong> 
                    ${meta.nomService} - ${meta.zone} - ${meta.frequence.replace(',', '.')} - ${parAffichee}
                </label>
            </div>
        `;
    });
    selectionHTML += `
        <button type="button" onclick="traiterSelectionAnnexe()" class="bouton-principal" style="background-color: #28a745; margin-top: 20px;">
            Traiter l'annexe sélectionnée </button>
    </form>`;

    tableContainer.innerHTML = selectionHTML;
    resultatsSection.style.display = 'block';
}

function traiterSelectionAnnexe() {
    const form = document.getElementById('form-selection-annexe');
    const selection = form.querySelector('input[name="annexe-select"]:checked');
    
    if (!selection) {
        alert("Veuillez sélectionner une annexe à traiter.");
        return;
    }

    const index = parseInt(selection.value);
    const meta = ANNEXES_META[index];

    document.getElementById('tableau-converti-container').innerHTML = '';
    
    const resultats = extraireDonneesEtCompleter(meta.fullText, meta);
    
    if (resultats.length > 0) {
        traiterResultats(resultats, 1); 
    } else {
        const statutMessage = document.getElementById('statut-message');
        
        // Déclaration du tableau de chiffres Romains pour pouvoir l'indexer
        const CHIFFRES_ROMAINS_100 = [
		    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 
            'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
            'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
            'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII', 'XXXVIII', 'XXXIX', 'XL',
            'XLI', 'XLII', 'XLIII', 'XLIV', 'XLV', 'XLVI', 'XLVII', 'XLVIII', 'XLIX', 'L',
            'LI', 'LII', 'LIII', 'LIV', 'LV', 'LVI', 'LVII', 'LVIII', 'LIX', 'LX',
            'LXI', 'LXII', 'LXIII', 'LXIV', 'LXV', 'LXVI', 'LXVII', 'LXVIII', 'LXIX', 'LXX',
            'LXXI', 'LXXII', 'LXXIII', 'LXXIV', 'LXXV', 'LXXVI', 'LXXVII', 'LXXVIII', 'LXXIX', 'LXXX',
            'LXXXI', 'LXXXII', 'LXXXIII', 'LXXXIV', 'LXXXV', 'LXXXVI', 'LXXXVII', 'LXXXVIII', 'LXXXIX', 'XC',
            'XCI', 'XCII', 'XCIII', 'XCIV', 'XCV', 'XCVI', 'XCVII', 'XCVIII', 'XCIX', 'C'
        ];
		
        const annexeNom = CHIFFRES_ROMAINS_100[index] || `(${index + 1})`; 
		
        statutMessage.textContent = `❌ Échec de la détection pour l'Annexe ${annexeNom} : Le format du tableau de rayonnement est inhabituel.`;
        document.getElementById('resultats').style.display = 'block';
    }
}


function analyserEtConvertir() {
    let inputText = document.getElementById('input-text').value; 
    const statutMessage = document.getElementById('statut-message');
    const resultatsSection = document.getElementById('resultats');
    
    try {
        resultatsSection.style.display = 'none';
        document.getElementById('tableau-converti-container').innerHTML = '';
        document.getElementById('export-text-container').innerHTML = ''; 
        statutMessage.textContent = '';
    } catch(e) { /* Ignorer */ }

    if (inputText.trim().length < 100) {
         statutMessage.textContent = "❌ Échec : Le contenu n'a pas pu être traité. Veuillez effectuer un nouveau copier-coller du texte de la décision et recommencer.";
         resultatsSection.style.display = 'block';
         return;
    }
    
    inputText = nettoyerTexte(inputText);
    const blocsAnnexes = inputText.split(/(?=\s*ANNEXE\s+)/i).filter(bloc => bloc.trim().length > 0);
    
    ANNEXES_META = []; 
    
    blocsAnnexes.forEach((blocTexte) => {
        const meta = extraireMetaData(blocTexte);
        if (meta) {
            ANNEXES_META.push(meta);
        }
    });

    if (ANNEXES_META.length === 0) {
        statutMessage.textContent = "❌ Échec : Aucune annexe contenant une PAR max n'a été trouvée.";
        resultatsSection.style.display = 'block';
        return;
    }

    if (ANNEXES_META.length === 1) {
        const meta = ANNEXES_META[0];
        const resultats = extraireDonneesEtCompleter(meta.fullText, meta);

        if (resultats.length > 0) {
            traiterResultats(resultats, 1);
        } else {
            statutMessage.textContent = "❌ Échec de la détection : Le format du tableau de rayonnement est inhabituel.";
            resultatsSection.style.display = 'block';
        }
    } else {
        afficherSelectionAnnexe(ANNEXES_META);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const inputTextarea = document.getElementById('input-text');
    if (inputTextarea) {
        // Permet de vider le champ où le texte de décision est collé
        inputTextarea.value = ''; 
    }

});
