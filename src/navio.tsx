import {Navio} from 'rn-navio';

import {Main} from '@app/screens/main';
import {AppointmentList} from '@app/screens/appointment-list';

import {useAppearance} from '@app/utils/hooks';
import {
  screenDefaultOptions,
  tabScreenDefaultOptions,
  getTabBarIcon,
  drawerScreenDefaultOptions,
} from '@app/utils/designSystem';

// NAVIO
export const navio = Navio.build({
  screens: {
    Main,
    AppointmentList,
  },
  stacks: {
    MainStack: {
      screens: ['Main'],
      containerOptions: {
        headerShown: false,
        title: 'Main',
      },
    },
    AppointmentStack: {
      screens: ['AppointmentList'],
      containerOptions: {
        title: 'Appointments',
        headerShown: true
      }
    }
  },
  tabs: {
    // main 3 tabs
    AppTabs: {
      layout: {
        Appointment: {
          stack: 'AppointmentStack',
          options: () => ({
            title: 'Appointments',
            tabBarIcon: getTabBarIcon('Appointment'),
          }),
        },
        Logout: {
          stack: 'MainStack',
          options: () => ({
            title: 'Logout',
            tabBarIcon: getTabBarIcon('Logout'),
          }),
        },
      },
    },
  },
  drawers: {
    AppDrawer: {
      layout: {
        Main:{
          stack: 'MainStack',
          options: {
            drawerType: 'front'
          }
        },
        AppointmentList:{
          stack: 'AppointmentStack',
          tabs: 'AppTabs',
          options: {
            drawerType: 'front'
          }
        }
      },
    },
  },
  root: 'stacks.MainStack',
  hooks: [useAppearance],
  defaultOptions: {
    stacks: {
      screen: screenDefaultOptions,
    },
    tabs: {
      screen: tabScreenDefaultOptions,
    },
    drawers: {
      screen: drawerScreenDefaultOptions,
    },
  },
});

export const getNavio = () => navio;
export const NavioApp = navio.App;
