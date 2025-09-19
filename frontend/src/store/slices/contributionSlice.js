/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  teamContributions: [],
  adherentContributions: [],
  loading: false,
  error: null,
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),
  stats: {
    team: { collected: 0, expected: 0, rate: 0 },
    adherents: { collected: 0, expected: 0, rate: 0 }
  }
};

const contributionSlice = createSlice({
  name: 'contributions',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setTeamContributions: (state, action) => {
      state.teamContributions = action.payload;
      state.loading = false;
      state.error = null;
    },
    setAdherentContributions: (state, action) => {
      state.adherentContributions = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateContributionStatus: (state, action) => {
      const { type, id, status, paymentDate } = action.payload;
      const contributions = type === 'team' ? state.teamContributions : state.adherentContributions;
      const contribution = contributions.find(c => c.id === id);
      if (contribution) {
        contribution.status = status;
        contribution.payment_date = paymentDate;
      }
    },
    setCurrentPeriod: (state, action) => {
      state.currentMonth = action.payload.month;
      state.currentYear = action.payload.year;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setTeamContributions,
  setAdherentContributions,
  updateContributionStatus,
  setCurrentPeriod,
  setStats,
  setError
} = contributionSlice.actions;

export default contributionSlice.reducer;