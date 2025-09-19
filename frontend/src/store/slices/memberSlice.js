/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  teamMembers: [],
  adherents: [],
  loading: false,
  error: null,
  filters: {
    activeOnly: true
  }
};

const memberSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setTeamMembers: (state, action) => {
      state.teamMembers = action.payload;
      state.loading = false;
      state.error = null;
    },
    setAdherents: (state, action) => {
      state.adherents = action.payload;
      state.loading = false;
      state.error = null;
    },
    addTeamMember: (state, action) => {
      state.teamMembers.push(action.payload);
    },
    addAdherent: (state, action) => {
      state.adherents.push(action.payload);
    },
    updateTeamMember: (state, action) => {
      const index = state.teamMembers.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.teamMembers[index] = action.payload;
      }
    },
    updateAdherent: (state, action) => {
      const index = state.adherents.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.adherents[index] = action.payload;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setTeamMembers,
  setAdherents,
  addTeamMember,
  addAdherent,
  updateTeamMember,
  updateAdherent,
  setError
} = memberSlice.actions;

export default memberSlice.reducer;