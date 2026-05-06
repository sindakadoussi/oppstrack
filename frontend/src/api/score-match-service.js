import { apiClient } from './http-client.js';
import { API_ROUTES } from './constants.js';

export const scoreMatchService = {
  async getRecommendations(userId) {
    return apiClient.get(API_ROUTES.scoreMatch.byUser(userId));
  },

  async getById(id) {
    return apiClient.get(API_ROUTES.scoreMatch.byId(id));
  },

  async create(scoreMatchData) {
    return apiClient.post(API_ROUTES.scoreMatch.create, scoreMatchData);
  },

  async update(id, data) {
    return apiClient.put(API_ROUTES.scoreMatch.update(id), data);
  },

  async calculateScore(user, bourse) {
    const scoreBreakdown = {
      pays: this._scorePays(user, bourse),
      niveau: this._scoreNiveau(user, bourse),
      domaine: this._scoreDomaine(user, bourse),
      statut: this._scoreStatut(user, bourse),
      deadline: this._scoreDeadline(bourse),
    };

    const score = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);
    const matchReasons = this._generateReasons(scoreBreakdown, user, bourse);

    return {
      score,
      scoreBreakdown,
      matchReasons,
    };
  },

  _scorePays(user, bourse) {
    if (!user.country || !bourse.countries) return 0;
    const bourseCountries = Array.isArray(bourse.countries) 
      ? bourse.countries 
      : [bourse.countries];
    return bourseCountries.includes(user.country) ? 30 : 0;
  },

  _scoreNiveau(user, bourse) {
    if (!user.educationLevel || !bourse.educationLevel) return 0;
    const userLevel = user.educationLevel.toLowerCase();
    const bourseLevel = bourse.educationLevel.toLowerCase();
    
    if (userLevel === bourseLevel) return 25;
    if (this._levelCompatible(userLevel, bourseLevel)) return 15;
    return 0;
  },

  _levelCompatible(userLevel, bourseLevel) {
    const levels = ['bachelor', 'master', 'phd'];
    const userIdx = levels.indexOf(userLevel);
    const bourseIdx = levels.indexOf(bourseLevel);
    return Math.abs(userIdx - bourseIdx) === 1;
  },

  _scoreDomaine(user, bourse) {
    if (!user.domains || !bourse.domains) return 0;
    const userDomains = Array.isArray(user.domains) ? user.domains : [user.domains];
    const bourseDomains = Array.isArray(bourse.domains) ? bourse.domains : [bourse.domains];
    
    const matches = userDomains.filter(d => bourseDomains.includes(d)).length;
    return Math.min(matches * 10, 20);
  },

  _scoreStatut(user, bourse) {
    if (!user.status || !bourse.eligibleStatus) return 0;
    const eligibleStatuses = Array.isArray(bourse.eligibleStatus) 
      ? bourse.eligibleStatus 
      : [bourse.eligibleStatus];
    return eligibleStatuses.includes(user.status) ? 15 : 0;
  },

  _scoreDeadline(bourse) {
    if (!bourse.deadline) return 0;
    const now = new Date();
    const deadline = new Date(bourse.deadline);
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return 0;
    if (daysLeft > 90) return 10;
    if (daysLeft > 30) return 7;
    if (daysLeft > 7) return 5;
    return 2;
  },

  _generateReasons(scoreBreakdown, user, bourse) {
    const reasons = [];
    
    if (scoreBreakdown.pays > 0) reasons.push('Pays correspondant');
    if (scoreBreakdown.niveau > 0) reasons.push('Niveau d\'étude compatible');
    if (scoreBreakdown.domaine > 0) reasons.push('Domaine d\'études correspondant');
    if (scoreBreakdown.statut > 0) reasons.push('Statut d\'étudiant(e) compatible');
    if (scoreBreakdown.deadline > 0) reasons.push('Délai de candidature approprié');
    
    return reasons.length > 0 ? reasons : ['Bourse potentiellement compatible'];
  },
};
