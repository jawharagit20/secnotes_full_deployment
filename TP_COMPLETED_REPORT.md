# TP DevSecOps — Réalisation complète avec `secnotes-vuln-app-with-ui`

Ce dossier suit l'ordre du TP guidé du support de cours : 6 missions progressives, de la découverte de l'application vulnérable jusqu'à la remédiation. Le TP du support demande explicitement d'avancer mission par mission, avec GitLab Runner local, SonarQube local, pipeline complet, Kubernetes local, puis AWS/Terraform, avant une remédiation finale. fileciteturn6file2turn6file1turn6file0

## Contenu fourni dans ce pack

- `secnotes-vuln-app` : application vulnérable utilisée pour les missions 1 à 5.
- `.gitlab-ci.yml` : pipeline complet aligné sur la structure demandée dans le support.
- `mission6_secure/` : version remédiée pour la mission 6.
- `TP_COMPLETED_REPORT.md` : réponses, commandes, analyses, résultats attendus.

## Mission 1 — Préparation et découverte de l'application

### Objectif
Installer l'environnement, lancer l'application, tester les endpoints, puis identifier les vulnérabilités principales. C'est exactement ce que demande la Mission 1 du TP guidé. fileciteturn7file0

### Commandes à exécuter

```bash
npm install

docker run -d --name mongodb \
  -p 27017:27017 \
  mongo:7

npm start
```

### Vérification rapide

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api
```

### Création d'un utilisateur puis connexion

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"azerty123","role":"user"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"azerty123"}'
```

### Création d'une note

```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{"title":"Ma première note","content":"Contenu de test"}'
```

### Réponses aux questions d'analyse

1. **Problème immédiat dans `config/db.js`**
   - Le fichier gère la connexion MongoDB avec une logique de secret sensible et journalise l'URI de connexion dans les logs. C'est cohérent avec la vulnérabilité “secrets en dur / exposition d'informations sensibles” attendue par le cours. fileciteturn7file0

2. **Test NoSQL injection avec** `{"username":{"$gt":""},"password":{"$gt":""}}`
   - La connexion peut réussir si un utilisateur existe, car l'application vulnérable laisse passer des objets dans la requête MongoDB. C'est la vulnérabilité V1 décrite dans le support. fileciteturn7file0turn7file1

3. **Accès à la note d'un autre utilisateur**
   - Oui, c'est possible dans la version vulnérable. Les opérations de lecture, modification et suppression ne vérifient pas correctement que la note appartient à l'utilisateur courant. Cela correspond à l'IDOR V4, que le cours indique aussi comme difficile à détecter par SonarQube. fileciteturn7file1turn6file1

### Vulnérabilités identifiées pendant la lecture du code

- V1 : NoSQL Injection
- V2 : secrets sensibles / configuration exposée
- V4 : IDOR sur les notes
- V6 : MD5 pour le mot de passe
- V8 : logs trop verbeux
- V10 : CORS trop permissif

Le support liste bien ces vulnérabilités dans l'inventaire de l'application. fileciteturn7file1

## Mission 2 — GitLab Runner et premier pipeline

### Objectif
Pousser le code sur GitLab, enregistrer un Runner local, puis faire passer un pipeline minimal. C'est exactement l'objectif de la mission 2. fileciteturn6file2

### Étapes

```bash
git init
git remote add origin https://gitlab.com/VOTRE-USERNAME/secnotes-devsecops.git
git add .
git commit -m "Initial commit - SecNotes vulnerable app"
git push -u origin main
```

### Pipeline minimal demandé

```yaml
stages:
  - test

hello_world:
  stage: test
  tags:
    - local
  script:
    - echo "🎉 Le Runner fonctionne !"
    - node --version
    - docker --version
```

### Réponses aux questions d'analyse

1. **Où s'exécute le job ?**
   - Sur le PC local où le GitLab Runner est installé, pas sur les serveurs GitLab. Le support insiste précisément sur cette distinction. fileciteturn7file1

2. **Si le Runner est arrêté ?**
   - Le pipeline restera en attente ou bloqué, car GitLab a besoin d'un Runner actif pour exécuter réellement les jobs. fileciteturn7file1

3. **Pourquoi le tag `local` ?**
   - Il sert à diriger le job vers le Runner qui possède ce tag. Le support recommande d'utiliser ce tag pendant l'enregistrement et dans les jobs. fileciteturn6file2turn7file1

## Mission 3 — SonarQube et analyse SAST

### Objectif
Installer SonarQube localement, lancer une analyse manuelle, puis interpréter les résultats. C'est le déroulé officiel de la mission 3. fileciteturn6file2turn6file1

### Lancement SonarQube

```bash
docker run -d --name sonarqube \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:lts-community
```

### Lancement du scan

```bash
npx sonarqube-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=VOTRE_TOKEN
```

### Interprétation attendue

SonarQube devrait remonter au moins une partie des problèmes liés aux secrets, au code faible, aux logs, et à certains hotspots. En revanche, le support rappelle qu'il ne détecte pas correctement certaines vulnérabilités logiques comme l'IDOR et qu'il est limité sur les injections NoSQL complexes. fileciteturn6file1turn7file1

### Réponses aux questions d'analyse

1. **Combien de Security Hotspots ?**
   - Le nombre exact dépendra de l'exécution réelle sur votre machine et de la version SonarQube, donc il faut relever ce nombre dans votre interface locale. Le support demande explicitement d'aller vérifier les onglets `Security Hotspots`, `Issues` et le `Quality Gate`. fileciteturn6file1

2. **L'IDOR apparaît-elle ?**
   - En général non, car c'est une faille de logique métier. Le support l'indique clairement. fileciteturn6file1turn7file1

3. **Le Quality Gate devrait-il passer ?**
   - En pratique, pour une application volontairement vulnérable, il ne devrait pas être considéré comme acceptable. Le support explique que cette application sert justement à observer les limites et les apports du SAST. fileciteturn6file1turn7file1

## Mission 4 — Pipeline complet avec Docker et Kubernetes local

### Objectif
Mettre en place le pipeline complet, puis déployer l'application sur Kubernetes local. C'est le cœur du TP, comme décrit dans la mission 4. fileciteturn6file1turn6file0

### Ce que j'ai préparé

Le fichier `.gitlab-ci.yml` du projet a été remplacé par un pipeline complet aligné sur la logique demandée par le support :

- `prepare`
- `test`
- `sast`
- `build`
- `deploy_local`
- `infra_aws`
- `deploy_aws` fileciteturn6file1turn6file0

### Variables GitLab à ajouter

- `SONAR_HOST_URL=http://localhost:9000`
- `SONAR_TOKEN=...`
- `AWS_ACCESS_KEY_ID=...`
- `AWS_SECRET_ACCESS_KEY=...`
- `AWS_DEFAULT_REGION=eu-west-1` fileciteturn6file0turn7file1

### Vérification après push

```bash
kubectl get all -n secnotes
curl http://localhost:30080/api
```

> Note : dans votre support, l'exemple de vérification montre un accès local sur un port NodePort exposé pour l'application. Les critères de réussite exigent que les stages principaux passent et que l'application soit accessible localement après le déploiement K8s. fileciteturn6file1turn6file0

### Résultat attendu

- Les stages `prepare`, `test`, `sast`, `build`, `deploy_local` deviennent verts.
- Les ressources K8s existent dans le namespace `secnotes`.
- L'application répond via le service local NodePort. fileciteturn6file1

## Mission 5 — Déploiement AWS avec Terraform

### Objectif
Provisionner l'infrastructure AWS, configurer `kubectl`, pousser l'image et déployer sur EKS. Le support insiste aussi sur la destruction finale pour éviter les coûts. fileciteturn6file0

### Étapes à exécuter sur votre machine

```bash
aws configure

cd terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan

aws eks update-kubeconfig --name secnotes-cluster --region eu-west-1
kubectl apply -f ../k8s/namespace.yaml
kubectl apply -f ../k8s/configmap.yaml -n secnotes
kubectl apply -f ../k8s/secret.yaml -n secnotes
kubectl apply -f ../k8s/deployment.yaml -n secnotes
kubectl apply -f ../k8s/service.yaml -n secnotes
```

### Fin obligatoire du TP AWS

```bash
terraform destroy
```

Le support précise bien que cette mission génère des coûts et qu'il faut tout détruire à la fin. fileciteturn6file0

### Limite honnête

Je ne peux pas exécuter votre vrai déploiement AWS depuis cet environnement, car il faut vos credentials, votre compte GitLab, votre Runner local, votre cluster local et votre compte AWS. J'ai donc préparé les fichiers et le déroulé exact, mais cette mission doit être lancée depuis votre machine. Le support lui-même suppose un environnement local et des comptes/configurations réels. fileciteturn6file0turn7file1

## Mission 6 — Remédiation et amélioration

### Objectif
Corriger au moins 3 vulnérabilités et observer l'impact dans SonarQube. Le support donne comme axes recommandés : variables d'environnement, bcrypt et Dockerfile plus sûr. fileciteturn6file0turn6file3

### Ce que j'ai corrigé dans `mission6_secure/`

1. **Secrets / configuration sensible**
   - `src/config/db.js` n'affiche plus l'URI MongoDB dans les logs.
   - `src/middleware/auth.js` lit `JWT_SECRET` depuis l'environnement.

2. **Hashage faible**
   - `md5` a été remplacé par `bcryptjs` dans `src/controllers/authController.js`.

3. **Validation de base sur register/login**
   - Les champs doivent être de vraies chaînes.
   - Le rôle ne peut plus être imposé librement par l'utilisateur.

4. **Dockerfile durci**
   - Multi-stage build.
   - Exécution avec un utilisateur non root.

5. **Secret Kubernetes**
   - Une version `stringData` a été préparée pour illustrer une gestion plus propre côté manifeste, même si un vrai secret management dédié resterait préférable en production.

Le support mentionne explicitement ces bonnes pratiques de remédiation en section d'amélioration. fileciteturn6file3

### Impact attendu sur SonarQube

Après correction et nouveau scan, vous devriez constater une amélioration sur les secrets, les pratiques crypto faibles et certains hotspots. En revanche, toutes les vulnérabilités logiques ne disparaîtront pas automatiquement du fait d'un simple scan SAST. Le support rappelle précisément cette limite. fileciteturn6file3turn7file1

## Réponses synthétiques prêtes à remettre

### Ce que montre ce TP

- GitLab sert d'orchestrateur, mais le Runner local exécute les jobs. fileciteturn7file1
- SonarQube détecte une partie des problèmes de sécurité, mais pas les failles logiques comme l'IDOR. fileciteturn6file1turn7file1
- Le pipeline complet automatise les tests, l'analyse SAST, le build Docker et le déploiement local K8s. fileciteturn6file1turn6file0
- Terraform permet de reproduire une infrastructure AWS, mais il faut gérer les coûts et détruire les ressources à la fin. fileciteturn6file0
- La remédiation la plus utile ici consiste à supprimer les secrets en dur, abandonner MD5, réduire les logs sensibles, et durcir le Dockerfile. fileciteturn6file3turn7file1

## Fichiers importants à rendre / montrer

- `.gitlab-ci.yml`
- `k8s/*.yaml`
- `terraform/*.tf`
- captures GitLab pipeline
- captures SonarQube
- captures `kubectl get all -n secnotes`
- captures du test local via navigateur ou `curl`
- dossier `mission6_secure/` pour la partie amélioration

## Conclusion

Le TP est prêt dans la structure attendue par le support : découverte d'une application vulnérable, mise en place du Runner local, analyse SAST avec SonarQube, pipeline GitLab complet, déploiement Kubernetes local, préparation AWS/Terraform, puis remédiation finale. La progression suit bien l'ordre et les objectifs fixés par le document de cours. fileciteturn7file0turn6file2turn6file1turn6file0
