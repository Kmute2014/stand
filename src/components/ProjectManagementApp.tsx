import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Program, Project, Sprint, Epic, UserStory, Status } from '../types/project';
import { User as AppUser } from '../types';
import { validateSprintCompletion } from '../utils/sprintValidation';
import { useAppContext } from '../store';
import { ProgramManager } from './ProgramManager';
import { ProgramDetailView } from './ProgramDetailView';
import { ProjectManager } from './ProjectManager';
import { SprintManager } from './SprintManager';
import { EpicKanbanBoard } from './EpicKanbanBoard';
import { GanttChart } from './GanttChart';

type ViewType = 'programs' | 'program-detail' | 'project' | 'sprint' | 'epic' | 'gantt';

export const ProjectManagementApp: React.FC = () => {
  const { users, currentUser } = useAppContext();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('programs');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [ganttData, setGanttData] = useState<Project | Sprint | null>(null);
  const [ganttType, setGanttType] = useState<'project' | 'sprint'>('project');

  // Initialize with sample data
  useEffect(() => {
    const sampleData: Program[] = [
      {
        id: uuidv4(),
        name: 'WorkPhelo ERP',
        description: 'Enterprise Resource Planning System',
        projects: [
          {
            id: uuidv4(),
            name: 'HR Phelo',
            description: 'Human Resources Management Module',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-06-30'),
            status: 'In Progress',
            programId: '',
            sprints: [
              {
                id: uuidv4(),
                name: 'Sprint 1',
                description: 'Foundation and Core Features',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-15'),
                status: 'In Progress',
                projectId: '',
                programId: '',
                epics: [
                  {
                    id: uuidv4(),
                    name: 'User Authentication',
                    description: 'Login and user management system',
                    order: 0,
                    sprintId: '',
                    projectId: '',
                    programId: '',
                    columns: [
                      {
                        id: 'col-product-backlog',
                        name: 'Product Backlog',
                        order: 0,
                        epicId: '',
                        sprintId: '',
                        projectId: '',
                        programId: '',
                        userStories: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                      {
                        id: 'col-refined-backlog',
                        name: 'Refined Backlog',
                        order: 1,
                        epicId: '',
                        sprintId: '',
                        projectId: '',
                        programId: '',
                        userStories: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                      {
                        id: 'col-in-progress',
                        name: 'In Progress',
                        order: 2,
                        epicId: '',
                        sprintId: '',
                        projectId: '',
                        programId: '',
                        userStories: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                      {
                        id: 'col-testing',
                        name: 'Testing',
                        order: 3,
                        epicId: '',
                        sprintId: '',
                        projectId: '',
                        programId: '',
                        userStories: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                      {
                        id: 'col-completed',
                        name: 'Completed',
                        order: 4,
                        epicId: '',
                        sprintId: '',
                        projectId: '',
                        programId: '',
                        userStories: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                    ],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Set proper IDs for relationships
    const processedData = sampleData.map(program => ({
      ...program,
      projects: program.projects.map(project => ({
        ...project,
        programId: program.id,
        sprints: project.sprints.map(sprint => ({
          ...sprint,
          projectId: project.id,
          programId: program.id,
          epics: sprint.epics.map(epic => ({
            ...epic,
            sprintId: sprint.id,
            projectId: project.id,
            programId: program.id,
            columns: epic.columns.map(column => ({
              ...column,
              epicId: epic.id,
              sprintId: sprint.id,
              projectId: project.id,
              programId: program.id,
              userStories: column.userStories.map(story => ({
                ...story,
                columnId: column.id,
                epicId: epic.id,
                sprintId: sprint.id,
                projectId: project.id,
                programId: program.id,
              })),
            })),
          })),
        })),
      })),
    }));

    setPrograms(processedData);
  }, []);

  // Debug: Track programs state changes
  useEffect(() => {
    console.log('ProjectManagementApp - programs state changed:', programs.length, 'programs');
    console.log('ProjectManagementApp - currentView:', currentView);
    console.log('ProjectManagementApp - selectedProgramId:', selectedProgramId);
    console.log('ProjectManagementApp - selectedProjectId:', selectedProjectId);
    console.log('ProjectManagementApp - selectedSprintId:', selectedSprintId);
  }, [programs, currentView, selectedProgramId, selectedProjectId, selectedSprintId]);

  const selectedProgram = programs.find(p => p.id === selectedProgramId);
  const selectedProject = selectedProgram?.projects.find(p => p.id === selectedProjectId);
  const selectedSprint = selectedProject?.sprints.find(s => s.id === selectedSprintId);

  // Debug logging
  console.log('Current state:', {
    currentView,
    selectedProgramId,
    selectedProjectId,
    selectedSprintId,
    selectedProgram: selectedProgram?.name,
    selectedProject: selectedProject?.name,
    programsCount: programs.length,
    programProjectsCount: selectedProgram?.projects.length
  });
  const selectedEpic = selectedSprint?.epics.find(e => e.id === selectedEpicId);

  const handleCreateProgram = (programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProgram: Program = {
      ...programData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPrograms([...programs, newProgram]);
  };

  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedProgramId) return;

    const newProject: Project = {
      ...projectData,
      id: uuidv4(),
      programId: selectedProgramId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPrograms(programs.map(program =>
      program.id === selectedProgramId
        ? { ...program, projects: [...program.projects, newProject], updatedAt: new Date() }
        : program
    ));
  };

  const handleCreateSprint = (sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSprint: Sprint = {
      ...sprintData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPrograms(programs.map(program => ({
      ...program,
      projects: program.projects.map(project =>
        project.id === sprintData.projectId
          ? { ...project, sprints: [...project.sprints, newSprint], updatedAt: new Date() }
          : project
      ),
    })));
  };

  const handleCreateEpic = (epicData: Omit<Epic, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEpic: Epic = {
      ...epicData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPrograms(programs.map(program => ({
      ...program,
      projects: program.projects.map(project =>
        project.id === epicData.projectId
          ? {
            ...project,
            sprints: project.sprints.map(sprint =>
              sprint.id === epicData.sprintId
                ? { ...sprint, epics: [...sprint.epics, newEpic], updatedAt: new Date() }
                : sprint
            ),
            updatedAt: new Date(),
          }
          : project
      ),
    })));
  };

  const handleCreateUserStory = (userStoryData: Omit<UserStory, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Creating user story with data:', userStoryData);
    const newUserStory: UserStory = {
      ...userStoryData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log('New user story created:', newUserStory);

    const updatedPrograms = programs.map(program => ({
      ...program,
      projects: program.projects.map(project =>
        project.id === userStoryData.projectId
          ? {
            ...project,
            sprints: project.sprints.map(sprint =>
              sprint.id === userStoryData.sprintId
                ? {
                  ...sprint,
                  epics: sprint.epics.map(epic =>
                    epic.id === userStoryData.epicId
                      ? {
                        ...epic,
                        columns: epic.columns.map(column =>
                          column.id === userStoryData.columnId
                            ? {
                              ...column,
                              userStories: [...column.userStories, newUserStory],
                              updatedAt: new Date(),
                            }
                            : column
                        ),
                        updatedAt: new Date(),
                      }
                      : epic
                  ),
                  updatedAt: new Date(),
                }
                : sprint
            ),
            updatedAt: new Date(),
          }
          : project
      ),
    }));

    console.log('Updated programs:', updatedPrograms);
    console.log('About to setPrograms with', updatedPrograms.length, 'programs');
    setPrograms(updatedPrograms);
    console.log('setPrograms called');
  };

  const handleUpdateEpic = (updatedEpic: Epic) => {
    setPrograms(programs.map(program => ({
      ...program,
      projects: program.projects.map(project =>
        project.id === updatedEpic.projectId
          ? {
            ...project,
            sprints: project.sprints.map(sprint =>
              sprint.id === updatedEpic.sprintId
                ? {
                  ...sprint,
                  epics: sprint.epics.map(epic =>
                    epic.id === updatedEpic.id ? updatedEpic : epic
                  ),
                  updatedAt: new Date(),
                }
                : sprint
            ),
            updatedAt: new Date(),
          }
          : project
      ),
    })));
  };

  const handleUpdateUserStory = (updatedUserStory: UserStory) => {
    setPrograms(programs.map(program => ({
      ...program,
      projects: program.projects.map(project =>
        project.id === updatedUserStory.projectId
          ? {
            ...project,
            sprints: project.sprints.map(sprint =>
              sprint.id === updatedUserStory.sprintId
                ? {
                  ...sprint,
                  epics: sprint.epics.map(epic =>
                    epic.id === updatedUserStory.epicId
                      ? {
                        ...epic,
                        columns: epic.columns.map(column =>
                          column.id === updatedUserStory.columnId
                            ? {
                              ...column,
                              userStories: column.userStories.map(story =>
                                story.id === updatedUserStory.id ? updatedUserStory : story
                              ),
                              updatedAt: new Date(),
                            }
                            : column
                        ),
                        updatedAt: new Date(),
                      }
                      : epic
                  ),
                  updatedAt: new Date(),
                }
                : sprint
            ),
            updatedAt: new Date(),
          }
          : project
      ),
    })));
  };

  const handleDeleteUserStory = (userStoryId: string) => {
    console.log('Deleting user story:', userStoryId);
    const updatedPrograms = programs.map(program => ({
      ...program,
      projects: program.projects.map(project => ({
        ...project,
        sprints: project.sprints.map(sprint => ({
          ...sprint,
          epics: sprint.epics.map(epic => ({
            ...epic,
            columns: epic.columns.map(column => ({
              ...column,
              userStories: column.userStories.filter(story => story.id !== userStoryId),
            })),
          })),
        })),
      })),
    }));
    console.log('About to setPrograms after delete with', updatedPrograms.length, 'programs');
    setPrograms(updatedPrograms);
    console.log('setPrograms called for delete');
  };

  const handleCompleteSprint = (sprintId: string) => {
    if (!selectedSprint) return { isValid: false, incompleteUserStories: [], incompleteSubtasks: [], errors: ['Sprint not found'] };

    const validation = validateSprintCompletion(selectedSprint);

    if (validation.isValid) {
      // Update sprint status to completed
      setPrograms(programs.map(program => ({
        ...program,
        projects: program.projects.map(project => ({
          ...project,
          sprints: project.sprints.map(sprint =>
            sprint.id === sprintId
              ? { ...sprint, status: 'Completed' as Status, updatedAt: new Date() }
              : sprint
          ),
        })),
      })));
    }

    return validation;
  };

  const handleSelectProgram = (programId: string) => {
    setSelectedProgramId(programId);
    setCurrentView('program-detail');
  };

  const handleSelectProject = (projectId: string) => {
    console.log('handleSelectProject called:', { projectId, currentView });

    // Find which program contains this project
    let programId = null;
    for (const program of programs) {
      if (program.projects.some(p => p.id === projectId)) {
        programId = program.id;
        break;
      }
    }

    if (programId) {
      setSelectedProgramId(programId);
      setSelectedProjectId(projectId);
      setCurrentView('project');
      console.log('After setting:', { selectedProjectId: projectId, selectedProgramId: programId, view: 'project' });
    } else {
      console.error('Project not found in any program:', { projectId });
    }
  };

  const handleSelectSprint = (sprintId: string) => {
    setSelectedSprintId(sprintId);
    setCurrentView('sprint');
  };

  const handleSelectEpic = (epicId: string) => {
    setSelectedEpicId(epicId);
    setCurrentView('epic');
  };

  const handleBack = () => {
    switch (currentView) {
      case 'program-detail':
        setCurrentView('programs');
        setSelectedProgramId(null);
        break;
      case 'project':
        setCurrentView('program-detail');
        setSelectedProjectId(null);
        break;
      case 'sprint':
        setCurrentView('project');
        setSelectedSprintId(null);
        break;
      case 'epic':
        setCurrentView('sprint');
        setSelectedSprintId(null);
        setSelectedEpicId(null);
        break;
      case 'gantt':
        if (ganttType === 'project') {
          setCurrentView('sprint');
        } else {
          setCurrentView('epic');
        }
        setGanttData(null);
        break;
    }
  };

  const handleShowGantt = () => {
    if (currentView === 'sprint' && selectedProject) {
      setGanttData(selectedProject);
      setGanttType('project');
      setCurrentView('gantt');
    } else if (currentView === 'epic' && selectedSprint) {
      setGanttData(selectedSprint);
      setGanttType('sprint');
      setCurrentView('gantt');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'programs' && (
        <ProgramManager
          programs={programs}
          onCreateProgram={handleCreateProgram}
          onSelectProgram={handleSelectProgram}
          onSelectProject={handleSelectProject}
        />
      )}

      {currentView === 'program-detail' && selectedProgram && (
        <ProgramDetailView
          program={selectedProgram}
          onCreateProject={handleCreateProject}
          onSelectProject={handleSelectProject}
          onBack={handleBack}
        />
      )}

      {currentView === 'project' && selectedProgram && selectedProjectId && (
        <>
          {(() => {
            const project = selectedProgram.projects.find(p => p.id === selectedProjectId);
            if (!project) {
              console.log('Project not found:', { selectedProjectId, availableProjects: selectedProgram.projects.map(p => p.id) });
              return (
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={handleBack}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                      <div className="text-sm text-gray-600">{selectedProgram.name}</div>
                      <h1 className="text-3xl font-bold text-gray-900">Project Not Found</h1>
                    </div>
                  </div>
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Calendar className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Project Not Found</h3>
                    <p className="text-gray-600 mb-4">The selected project could not be found</p>
                    <button
                      onClick={handleBack}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Back to Program
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <ProjectManager
                project={project}
                programName={selectedProgram.name}
                onCreateSprint={handleCreateSprint}
                onSelectSprint={handleSelectSprint}
                onBack={handleBack}
                onShowGantt={handleShowGantt}
              />
            );
          })()}
        </>
      )}

      {currentView === 'sprint' && selectedProject && (
        <SprintManager
          sprint={selectedProject.sprints.find(s => s.id === selectedSprintId)!}
          projectName={selectedProject.name}
          programName={selectedProgram?.name || ''}
          currentUser={currentUser}
          onCreateEpic={handleCreateEpic}
          onSelectEpic={handleSelectEpic}
          onBack={handleBack}
          onShowGantt={handleShowGantt}
          onCompleteSprint={handleCompleteSprint}
          onCreateUserStory={handleCreateUserStory}
          onUpdateUserStory={handleUpdateUserStory}
          onDeleteUserStory={handleDeleteUserStory}
          onUpdateEpic={handleUpdateEpic}
        />
      )}

      {currentView === 'epic' && selectedEpic && (
        <EpicKanbanBoard
          epic={selectedEpic}
          sprintName={selectedSprint?.name || ''}
          projectName={selectedProject?.name || ''}
          programName={selectedProgram?.name || ''}
          currentUser={currentUser}
          onBack={handleBack}
          onUpdateEpic={handleUpdateEpic}
          onCreateUserStory={handleCreateUserStory}
          onUpdateUserStory={handleUpdateUserStory}
          onDeleteUserStory={handleDeleteUserStory}
          appUsers={users}
        />
      )}

      {currentView === 'gantt' && ganttData && (
        <GanttChart
          data={ganttData}
          type={ganttType}
          projectName={selectedProject?.name}
          programName={selectedProgram?.name}
          sprintName={selectedSprint?.name}
          onBack={handleBack}
        />
      )}
    </div>
  );
};
