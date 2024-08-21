import { DateLeave, LeaveItem, LeavePeriod, Squad, UserLeaves, Users } from '@/entities.js';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dotenv/config';
import _ from 'lodash';


const API_KEY = process.env.REACT_APP_API_KEY;
const BASE_URL = `https://lelivrescolaire.ilucca.net`;

// users per squad

export const squadDoc: Squad = {
    name: "Squad Documentation",
    userIds: [39, 58, 57]
};
export const squadAcc: Squad = {
    name: "Squad Accompagnement",
    userIds: [5, 66, 2]
};
export const squadCom: Squad = {
    name: "Squad Communauté",
    userIds: [10, 71, 25, 29, 74, 14]
};
export const teamQA: Squad = {
    name: "Team QA",
    userIds: [8, 17, 49]
};
export const archi: Squad = {
    name: "Architecte",
    userIds: [51]
};
export const devOps: Squad = {
    name: "Devops",
    userIds: [30]
};
export const totalDays = 10;


//Liste de tous les users dans Tech

export const allTechUsers = (): Promise<Users> => {
    return axios.get<Users>(`${BASE_URL}/timmi-absences/api/planning/v1.0/users?limit=50&page=1&fields.root=count&sort=departmentHierarchyId,lastName,firstName&population.departmentWithSubIds=9, 12`, {
        headers: {
            'Authorization': `lucca application=${API_KEY}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            const usersTech: Users = response.data;
            return usersTech;
        })
        .catch(error => {
            console.error(`Une erreur est survenue : ${error}`);
            throw error;
        });
}


//personnes dans une squad :

export const getSquad = (squad: Squad): Promise<Users> => {
    return axios.get(`${BASE_URL}/timmi-absences/api/planning/v1.0/users?limit=50&page=1&fields.root=count&sort=lastName,firstName&population.userIds=${squad.userIds}`, {
        headers: {
            'Authorization': `lucca application=${API_KEY}`,
            'Content-Type': 'application/json'
        }
    }).then(response => {
        const inSquad = response.data;
        return inSquad
    })
        .catch(error => {
            console.error(`Une erreur est survenue : ${error}`);
        });
}


//absences et présences par id

export const getLeavesByUserId = (id: number): Promise<UserLeaves> => {
    return axios.get<UserLeaves>(`${BASE_URL}/api/v3/leaves?fields=leavePeriod[id,ownerId,isConfirmed],isAm,date,color,isRemoteWork,isRealLeave,leaveAccount[id,name,i18nLabels[name,cultureCodeIso6391]isRemoteWork]&leavePeriod.ownerId=${id}&date=between,2024-08-01,2024-08-10`, {
        headers: {
            'Authorization': `lucca application=${API_KEY}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.error(`Une erreur est survenue : ${error}`);
            throw error;
        });
}

//requête entrées de dates

export const dateLeave = (id: number): Promise<DateLeave[]> => {
    return axios.get<DateLeave[]>(`${BASE_URL}/timmi-absences/api/planning/v1.0/userDates?owner.id=${id}&date=between,2024-08-01,2024-08-10&amOrPmIsOff=true`, {
        headers: {
            'Authorization': `lucca application=${API_KEY}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.error(`Une erreur est survenue : ${error}`);
            throw error;
        });
}

export const presenceForAllUsers = async () => {
    try {
        const usersTechRes = await allTechUsers();
        const usersTech = usersTechRes.items;

        for (const user of usersTech) {
            const userLeaves: UserLeaves = await getLeavesByUserId(user.id);
            const totalAbsences = userLeaves.data.items.length / 2;
            const presenceDays = 10 - totalAbsences;
            console.log(`${user.firstName} ${user.lastName} sera présent ${presenceDays} jours sur 10`);
        }
    } catch (error) {
        console.error(`Une erreur est survenue : ${error}`);
    }
}

export const getLeavesBySquad = async (squad: Squad) => {

    try {
        console.log(`Bienvenue dans ce nouveau sprint! \nVoici les présences et absences prévues du -- au -- \n`)
        console.log(`${squad.name}:`);

        for (const userId of squad.userIds) {
            const leavesData = await getLeavesByUserId(userId);
            const absenceDays = leavesData.data.items.length / 2;
            const presenceDays = totalDays - absenceDays;

            const groupedByDate = _.groupBy(leavesData.data.items, 'date');

            const user = (await allTechUsers()).items.find(user => user.id === userId);
            if (user) {
                console.log(`${user.firstName} ${user.lastName} sera présent(e) ${presenceDays} jours sur 10`);
            }
            if (user && Object.keys(groupedByDate).length > 0) {
                console.log(`Jours d'absence pour ${user.firstName} ${user.lastName}:`);

                for (const date in groupedByDate) {
                    const items: LeaveItem[] = groupedByDate[date];
                    const amLeave: LeaveItem = items.find(item => item.isAM === true)!;
                    const pmLeave: LeaveItem = items.find(item => item.isAM === false)!;

                    if (amLeave && pmLeave) {
                        console.log(dayjs(date).format('DD/MM/YYYY'));
                    } else if (amLeave) {
                        console.log(`${dayjs(date).format('DD/MM/YYYY')} - Matin`);
                    } else if (pmLeave) {
                        console.log(`${dayjs(date).format('DD/MM/YYYY')} - Après-midi`);
                    }
                }
            }

            if (user && leavesData.data.items.length >= 10 * 2) {
                console.log(`${user.firstName} ${user.lastName} sera absent sur la durée de ce sprint`)

            }
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération des jours de présence pour la squad : ${error}`);
    }
};







