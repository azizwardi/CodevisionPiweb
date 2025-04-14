import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Gestion des Utilisateurs | CodevisionPiweb"
        description="Page de gestion des utilisateurs pour CodevisionPiweb"
      />
      <PageBreadcrumb pageTitle="Liste des Utilisateurs" />
      <div className="space-y-6">
        <ComponentCard title="Liste des Utilisateurs">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </>
  );
}
