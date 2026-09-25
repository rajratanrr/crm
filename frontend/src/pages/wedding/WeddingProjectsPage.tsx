import { useState } from 'react';
import Projects from '../../wedding/pages/Projects';
import CreateProject from '../../wedding/pages/CreateProject';

export default function WeddingProjectsPage() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  if (view === 'create') {
    return <CreateProject project={null} onDone={() => setView('list')} />;
  }

  if (view === 'edit' && selectedProject) {
    return (
      <CreateProject
        project={selectedProject}
        onDone={() => {
          setSelectedProject(null);
          setView('list');
        }}
      />
    );
  }

  return (
    <Projects
      onCreate={() => setView('create')}
      onEdit={(project: any) => {
        setSelectedProject(project);
        setView('edit');
      }}
    />
  );
}
