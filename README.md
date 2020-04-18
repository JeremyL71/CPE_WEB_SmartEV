
# CPE_WEB
Projet de création de site web recherchant les bornes de recharge pour voiture electrique

Le site est accessible à l'adresse suivante : https://jeremyl71.github.io/CPE_WEB_SmartEV/


### Point de la version datant du 18/04/2020:
- **Couverture du territoire**: Uniquement en France si l'option "open_charge_map": est
de type "false" dans le fichier de configuration 'config.js'
- **Utilisation des logs**: Les logs se configure dans la fichier config.js

### **Liste des bugs existants**: 
- Certains marqueurs ne s'effacent pas après une relance de recherche
- Si les données sont limitées à la France par le fichier de configuration, le
le programme va planter et ne pas afficher de message d'erreur. (Il  recharge sans arrêt
aux points de recharges trouvées proche de la frontière).

### **Problèmes existants**:
- **Les données**: Certaines données concernant les points de charge sont incomplètes (aucunes
indication concernant l'existances des bornes sur un point de charge données, bornes
obsolètes, puissance de charges d'une bornes etc... Dans le cas où il n'y a aucune information
concernant la borne de recharge trouve, le programme est censé trouve la borne la plus proche de
cette dernière afin de proposer une solution alternative si celle-ci dispose des données souhaitées.
Dans le cas contraire, l'application s'excuse et propose à l'utilisateur de chercher sur Google.
Dans le cas où la borne possède toute les données souhaitées sauf celle concernant la puissance de 
la borne, une valeur par défaut est définie pour remplacer cette données. Cette valeur correspond à 
la valeur moyenne de toutes les bornes (environ 50 Kwh). Elle réalise le calcule avec ce chiffre
mais préviens l'utilisateur que la durée de rechargement peut être différente.


### **Améliorations possibles**:
- Proposition de résultat dans la barre de recherche du point d'arrivé et de destination.
- Amélioration de l'expérience utilisateur par du UX design
- Calcul du temps de trajet (difficile puisque cela doit déterminer le temps de trajet 
entre les différentes étapes --> prise en compte de la vitesse, du traffic etc...)
- Création d'un compte avec un historique des trajets de l'utilisateur
- Améliorations des informations des bornes + classifications des bornes

    

