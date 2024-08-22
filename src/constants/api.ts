import { Absences, AbsentUsers, DateLeave, GroupedByDate, LeaveItem, LeavePeriod, Squad, UserLeaves, Users } from '@/entities.js';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dotenv/config';
import _ from 'lodash';


const API_KEY = process.env.REACT_APP_API_KEY;
const BASE_URL = `https://lelivrescolaire.ilucca.net`;

// users per squad

export const squadDoc: Squad = {
    name: "✨ Squad Documentation",
    userIds: [39, 58, 57]
};
export const squadAcc: Squad = {
    name: "🌈 Squad Accompagnement",
    userIds: [5, 66, 2]
};
export const squadCom: Squad = {
    name: "🦄 Squad Communauté",
    userIds: [10, 71, 25, 29, 74, 14]
};
export const teamQA: Squad = {
    name: "🔬 Team QA",
    userIds: [49, 8, 17]
};
export const archi: Squad = {
    name: "👷 Architecte",
    userIds: [51]
};
export const devOps: Squad = {
    name: "🛠️ Devops",
    userIds: [30]
};
export const totalDays = 10;


//Liste de tous les users dans Tech

export const allTechUsers = (): Promise<Users> => {
    return axios.get<Users>(`${BASE_URL}/timmi-absences/api/planning/v1.0/users?limit=50&page=1&fields.root=count&sort=departmentHierarchyId,lastName,firstName&population.departmentWithSubIds=9, 10, 12`, {
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
    return axios.get<UserLeaves>(`${BASE_URL}/api/v3/leaves?fields=leavePeriod[id,ownerId,isConfirmed],isAm,date,color,isRemoteWork,isRealLeave,leaveAccount[id,name,i18nLabels[name,cultureCodeIso6391]isRemoteWork]&leavePeriod.ownerId=${id}&date=between,2024-07-29,2024-08-09`, {
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
        const totalDevelopers = squad.userIds.length;
        let totalPresenceDays = 0;
        let totalAbsenceDays = 0;
        const fullyPresentUsers: string[] = [];
        const absentUsers: AbsentUsers[] = [];

        for (const userId of squad.userIds) {
            const leavesData = await getLeavesByUserId(userId);
            const absenceDays = leavesData.data.items.length / 2;
            const presenceDays = totalDays - absenceDays;
            const presenceRate = (presenceDays / totalDays) * 100;

            totalPresenceDays += presenceDays;
            totalAbsenceDays += absenceDays;

            const groupedByDate: GroupedByDate = _.groupBy(leavesData.data.items, 'date');

            const user = (await allTechUsers()).items.find(user => user.id === userId);
            if (user) {
                if (presenceDays === totalDays) {
                    fullyPresentUsers.push(`${user.firstName} ${user.lastName}`);
                } else if (presenceDays < totalDays) {
                    const absences: string[] = [];
                    for (const date in groupedByDate) {
                        const items: LeaveItem[] = groupedByDate[date];
                        const amLeave: LeaveItem = items.find(item => item.isAM === true)!;
                        const pmLeave: LeaveItem = items.find(item => item.isAM === false)!;

                        if (amLeave && pmLeave) {
                            absences.push(dayjs(date).format('DD/MM/YYYY'));
                        } else if (amLeave) {
                            absences.push(`${dayjs(date).format('DD/MM/YYYY')} - Matin`);
                        } else if (pmLeave) {
                            absences.push(`${dayjs(date).format('DD/MM/YYYY')} - Après-midi`);
                        }
                    }
                    absentUsers.push({
                        userName: `${user.firstName} ${user.lastName}`,
                        presenceDays,
                        absences
                    });
                }
            }

        }
        const totalDaysAvailable = totalDevelopers * totalDays;
            const globalPresenceRate = (totalPresenceDays / totalDaysAvailable) * 100;
            console.log(`🚀 Nouveau Sprint, Let's Go ! \nPériode du : ---- au -----\n`);
            console.log(`\nSalut, ${squad.name} !`);
            console.log(`Le taux de présence de votre équipe est de ${globalPresenceRate.toFixed(0)}% pour ce sprint.\n`);

            if (fullyPresentUsers.length) {
                console.log(`${fullyPresentUsers.length} dev(s) présent(s) sur toute la durée du sprint :`);
                fullyPresentUsers.forEach(user => {
                    console.log(`- ${user}`);
                });
                console.log('\n');
            }


            absentUsers.forEach(user => {
                if (user.presenceDays === 0){
                    console.log(`${user.userName} sera absent sur toute la durée de ce sprint\n`)
                } else {
                console.log(`${user.userName} sera présent(e) ${user.presenceDays} jours sur ${totalDays}. Jours d'absence à prévoir :`);
                user.absences.forEach(absence => {
                    console.log(`- ${absence}`);
                });
                console.log('\n');
            }
            });
    } catch (error) {
        console.error(`Erreur lors de la récupération des jours de présence pour la squad : ${error}`);
    }
};

export const getSquadAbsenceData = async (squad: Squad) => {
    try {
        const totalDevelopers = squad.userIds.length;
        let totalPresenceDays = 0;
        let totalAbsenceDays = 0;
        const absences: Absences[] = [];

        for (const userId of squad.userIds) {
            const leavesData = await getLeavesByUserId(userId);
            const absenceDays = leavesData.data.items.length / 2;
            const presenceDays = totalDays - absenceDays;

            totalAbsenceDays += absenceDays;
            totalPresenceDays += presenceDays;

            const user = (await allTechUsers()).items.find(user => user.id === userId);
            if (user && absenceDays > 0) {
                absences.push({ userName: `${user.firstName} ${user.lastName}`, daysAbsent: absenceDays });
            }
        }

        const totalDaysAvailable = totalDevelopers * totalDays;
        const globalPresenceRate = (totalPresenceDays / totalDaysAvailable) * 100;
        
        return { squadName: squad.name, globalPresenceRate, absences };

    } catch (error) {
        console.error(`Erreur lors de la récupération des données d'absence pour la squad : ${error}`);
    }
};

// one message for all :

export const getGlobalMessage = async () => {
    try {
        console.log(`🚀 Nouveau Sprint, Let's Go ! \nPériode du : ---- au -----\n`);

        const squads = [squadDoc, squadAcc, squadCom, teamQA, archi, devOps];
        for (const squad of squads) {
            const squadAbsenceData = await getSquadAbsenceData(squad);

            const squadName = squadAbsenceData?.squadName;
            const globalPresenceRate = squadAbsenceData?.globalPresenceRate;
            const absences = squadAbsenceData?.absences;

            console.log(`\n ${squadName}`);
            console.log(`Taux de présence global : ${globalPresenceRate?.toFixed(0)}%`);

            if (absences?.length) {
                console.log(`Absences à prévoir :`);
                absences.forEach(absence => {
                    console.log(`   👤 ${absence.userName} : ${absence.daysAbsent} jours`);
                });
            } else {
                console.log(`Absences à prévoir : \nAucune! votre équipe est au complet 🤗`);
            }
        }
    } catch (error) {
        console.error(`Erreur lors de la génération du message global : ${error}`);
    }
}






