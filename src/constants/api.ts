import { Absences, AbsentUsers, DateLeave, GroupedByDate, LeaveItem, LeavePeriod, Squad, UserLeaves, Users } from '@/entities.js'
import axios from 'axios'
import dayjs from 'dayjs'
import 'dotenv/config'
import _ from 'lodash'
import axiosConfig from '../../axiosConfig.js'

export const squadDoc: Squad = {
    name: "✨ Squad Documentation",
    userIds: [39, 58, 57]
}
export const squadAcc: Squad = {
    name: "🌈 Squad Accompagnement",
    userIds: [5, 66, 2]
}
export const squadCom: Squad = {
    name: "🦄 Squad Communauté",
    userIds: [10, 71, 25, 29, 74, 14]
}
export const teamQA: Squad = {
    name: "🔬 Team QA",
    userIds: [49, 8, 17]
}
export const archi: Squad = {
    name: "👷 Architecte",
    userIds: [51]
}
export const devOps: Squad = {
    name: "🛠️ Devops",
    userIds: [30]
};
export const totalDays = 10

// date format for Queries
export const sprintStartQ = dayjs().startOf('date').format('YYYY-MM-DD')
export const sprintEndQ = dayjs().endOf('date').add(11, 'day').format('YYYY-MM-DD')

// date format for Display
export const sprintStartD = dayjs().startOf('date').format('DD/MM/YYYY')
export const sprintEndD = dayjs().endOf('date').add(11, 'day').format('DD/MM/YYYY')


//All users in TECH + PRODUCT + QA

export const allTechUsers = (): Promise<Users> => {
    return axiosConfig.get<Users>('/timmi-absences/api/planning/v1.0/users?limit=50&page=1&fields.root=count&sort=departmentHierarchyId,lastName,firstName&population.departmentWithSubIds=9, 10, 12'
    )
        .then(response => response.data
        ).catch(error => {
            console.error(`Une erreur est survenue : ${error}`)
            throw error
        })
}


//list the users in one squad

export const getSquad = (squad: Squad): Promise<Users> => {
    return axiosConfig.get(`/timmi-absences/api/planning/v1.0/users?limit=20&page=1&fields.root=count&sort=lastName,firstName&population.userIds=${squad.userIds}`
    ).then(response => response.data
    ).catch(error => {
        console.error(`Une erreur est survenue : ${error}`)
        throw error
    })
}

export const getLeavesByUserId = (id: number): Promise<UserLeaves> => {
    return axiosConfig.get<UserLeaves>(`/api/v3/leaves?fields=leavePeriod[id,ownerId,isConfirmed],isAm,date&leavePeriod.ownerId=${id}&date=between,${sprintStartQ},${sprintEndQ}`
    ).then(response => response.data
    ).catch(error => {
        console.error(`Une erreur est survenue : ${error}`)
        throw error
    });
}

export const presenceForAllUsers = async () => {
    try {
        const usersTechRes = await allTechUsers();
        const usersTech = usersTechRes.items

        for (const user of usersTech) {
            const userLeaves: UserLeaves = await getLeavesByUserId(user.id)
            if (userLeaves.data.items.length > 0) {
                const totalAbsences = userLeaves?.data?.items?.length / 2
                const presenceDays = 10 - totalAbsences
                console.log(`${user.firstName} ${user.lastName} sera présent ${presenceDays} jour(s) sur 10`)
            }
        }
    } catch (error) {
        console.error(`Une erreur est survenue : ${error}`);
        throw error
    }
}

// Absences and presences sorted by Squad

export const getLeavesBySquad = async (squad: Squad) => {

    try {
        const totalDevelopers = squad.userIds.length
        let totalPresenceDays = 0
        let totalAbsenceDays = 0
        const fullyPresentUsers: string[] = []
        const absentUsers: AbsentUsers[] = []

        if (squad.userIds.length > 0) {

            for (const userId of squad.userIds) {
                const leavesData = await getLeavesByUserId(userId)
                const absenceDays = leavesData?.data?.items?.length / 2
                const presenceDays = totalDays - absenceDays

                totalPresenceDays += presenceDays
                totalAbsenceDays += absenceDays

                const groupedByDate: GroupedByDate = _.groupBy(leavesData.data.items, 'date')

                const user = (await allTechUsers()).items.find(user => user.id === userId)
                if (user) {
                    if (presenceDays === totalDays) {
                        fullyPresentUsers.push(`${user.firstName} ${user.lastName}`);
                    } else if (presenceDays < totalDays) {
                        const absences: string[] = []
                        for (const date in groupedByDate) {
                            const items = groupedByDate[date]

                            const amLeave = items.find(item => item.isAM === true)!
                            const pmLeave = items.find(item => item.isAM === false)!

                            const formatDate = dayjs(date).format('DD/MM/YYYY')

                            absences.push(`${formatDate}  ${(!(amLeave && pmLeave) ? (amLeave ? '- Matin' : '- Après-midi') : '')}`)

                        }
                        absentUsers.push({
                            userName: `${user.firstName} ${user.lastName}`,
                            presenceDays,
                            absences
                        })
                    }
                }

            }
            const totalDaysAvailable = totalDevelopers * totalDays;
            const globalPresenceRate = (totalPresenceDays / totalDaysAvailable) * 100;
            console.log(`🚀 Nouveau Sprint, Let's Go ! \nPériode du : ${sprintStartD} au ${sprintEndD}\n`);
            console.log(`\nSalut, ${squad.name} !`);

            if (totalDaysAvailable) {

                console.log(`Le taux de présence de votre équipe est de ${globalPresenceRate.toFixed(0)}% pour ce sprint.\n`);
            }
            else {
                console.log(`${squad.name} n'est pas disponible sur cette période`)
            }
            if (fullyPresentUsers.length) {
                console.log(`${fullyPresentUsers.length} dev(s) présent(s) sur toute la durée du sprint :`)
                fullyPresentUsers.forEach(user => {
                    console.log(`- ${user}`)
                });
                console.log('\n')
            }
            absentUsers.forEach(user => {
                if (user.presenceDays === 0) {
                    console.log(`${user.userName} sera absent sur toute la durée de ce sprint\n`)
                } else {
                    console.log(`${user.userName} sera présent(e) ${user.presenceDays} jours sur ${totalDays}. Jours d'absence à prévoir :`);
                    user.absences.forEach(absence => {
                        console.log(`- ${absence}`)
                    })
                    console.log('\n')
                }
            })
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération des jours de présence pour la squad : ${error}`)
        throw error
    }
}

// Creation of an array with absences and presences by squad, that will be displayed in the global message :

export const getSquadAbsenceData = async (squad: Squad) => {

    if (squad.userIds.length) {

        try {
            const totalDevelopers = squad.userIds.length
            let totalPresenceDays = 0
            let totalAbsenceDays = 0
            const absences: Absences[] = []

            for (const userId of squad.userIds) {
                const leavesData = await getLeavesByUserId(userId)
                const absenceDays = leavesData?.data?.items?.length / 2
                const presenceDays = totalDays - absenceDays

                totalAbsenceDays += absenceDays
                totalPresenceDays += presenceDays

                const user = (await allTechUsers()).items.find(user => user.id === userId)
                if (user && absenceDays > 0) {
                    absences.push({ userName: `${user.firstName} ${user.lastName}`, daysAbsent: absenceDays })
                }
            }
            const totalDaysAvailable = totalDevelopers * totalDays
            const globalPresenceRate = (totalPresenceDays / totalDaysAvailable) * 100

            return { squadName: squad.name, globalPresenceRate, absences }

        } catch (error) {
            console.error(`Erreur lors de la récupération des données d'absence pour la squad : ${error}`)
            throw error
        }
    }
}

    // one message for all :

export const getGlobalMessage = async () => {
    try {
        console.log(`🚀 Nouveau Sprint, Let's Go ! \nPériode du : ${sprintStartD} au ${sprintEndD}\n`)

        const squads = [squadDoc, squadAcc, squadCom, teamQA, archi, devOps]
        for (const squad of squads) {
            if (squad.userIds.length > 0) {
                const squadAbsenceData = await getSquadAbsenceData(squad)

                const squadName = squadAbsenceData?.squadName
                const globalPresenceRate = squadAbsenceData?.globalPresenceRate
                const absences = squadAbsenceData?.absences

                console.log(`\n ${squadName}`)
                console.log(`Taux de présence global : ${globalPresenceRate?.toFixed(0)}%`)

                if (absences?.length) {
                    console.log(`Absences à prévoir :`)
                    absences.forEach(absence => {
                        console.log(`   👤 ${absence.userName} : ${absence.daysAbsent} jour(s)`)
                    })
                } else {
                    console.log(`Absences à prévoir : \nAucune! votre équipe est au complet 🤗`)
                }

            } else { console.log(`\n${squad.name} n'est pas disponible sur cette période`) }
        }
    } catch (error) {
        console.error(`Erreur lors de la génération du message global : ${error}`)
        throw error
    }
}

