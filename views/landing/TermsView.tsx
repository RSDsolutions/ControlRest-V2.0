import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const TermsView: React.FC = () => {
    const navigate = useNavigate();
    const [openSections, setOpenSections] = useState<number[]>([1]);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    const toggleSection = (id: number) => {
        setOpenSections(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const scrollToSection = (id: number) => {
        // Ensure section is open
        if (!openSections.includes(id)) {
            setOpenSections(prev => [...prev, id]);
        }

        // Scroll to the element after a brief delay to allow re-render if it was closed
        setTimeout(() => {
            const element = document.getElementById(`section-${id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const sections = [
        {
            id: 1,
            title: "1. Identificación del Prestador",
            icon: "corporate_fare",
            content: (
                <div className="space-y-4">
                    <p>El servicio RestoGestión ERP es operado y provisto por RestoGestión S.A.S. (en adelante, "RestoGestión"), una sociedad legalmente constituida bajo las leyes de la República del Ecuador.</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-400">
                        <li>RUC: 1793134047001</li>
                        <li>Domicilio Legal: Av. Interoceánica km 11.5, Quito, Ecuador</li>
                        <li>Email de contacto: legal@restogestion.ec</li>
                        <li>Representante Legal: Luis Pérez Arocas</li>
                    </ul>
                </div>
            )
        },
        {
            id: 2,
            title: "2. Objeto del Servicio",
            icon: "inventory_2",
            content: (
                <div className="space-y-4">
                    <p>RestoGestión proporciona una plataforma de software como servicio (SaaS) diseñada para la gestión integral de establecimientos gastronómicos. Las funcionalidades principales incluyen, pero no se limitan a:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-400">
                        <li>Gestión financiera y contable simplificada para restaurantes.</li>
                        <li>Control de inventarios en tiempo real con alertas de stock y mermas.</li>
                        <li>Análisis de costos y rentabilidad por plato.</li>
                        <li>Módulos de facturación electrónica integrados con el SRI.</li>
                        <li>Reportes gerenciales basados en Business Intelligence.</li>
                    </ul>
                    <p className="text-sm italic">El servicio se proporciona "tal cual" y "según disponibilidad". RestoGestión se reserva el derecho de modificar, actualizar o descontinuar funcionalidades por razones de mejora técnica u operativa.</p>
                </div>
            )
        },
        {
            id: 3,
            title: "3. Aceptación de Términos",
            icon: "check_circle",
            content: (
                <p>Al registrarse, acceder o utilizar cualquier parte del servicio RestoGestión ERP, usted reconoce haber leído, entendido y aceptado estos Términos y Condiciones. Estos constituyen un contrato legal vinculante. Si legalmente no está de acuerdo con alguno de los términos aquí descritos, no debe utilizar el servicio.</p>
            )
        },
        {
            id: 4,
            title: "4. Registro y Cuenta",
            icon: "person_add",
            content: (
                <div className="space-y-4">
                    <p>Para utilizar el servicio, el usuario deberá registrarse y crear una cuenta. El Usuario es responsable de proporcionar información veraz, exacta, actual y completa sobre sí mismo y sobre su negocio.</p>
                    <p>La seguridad de la cuenta y de la contraseña es de la total responsabilidad de cada Usuario titular o Master. Cualquier actividad realizada desde la cuenta será considerada responsabilidad del Usuario titular. RestoGestión no será responsable por pérdidas o daños derivados del incumplimiento de estas obligaciones de seguridad.</p>
                </div>
            )
        },
        {
            id: 5,
            title: "5. Propiedad Intelectual",
            icon: "gavel",
            content: (
                <div className="space-y-4">
                    <p>RestoGestión ERP, su código fuente, diseño, bases de datos, logotipos y documentación son propiedad exclusiva de RestoGestión S.A.S. y están protegidos por las leyes de propiedad intelectual de Ecuador y tratados internacionales.</p>
                    <p>Se otorga al Usuario una licencia limitada, no exclusiva, intransferible y revocable para utilizar el software exclusivamente para sus operaciones comerciales durante el periodo de suscripción vigente.</p>
                </div>
            )
        },
        {
            id: 6,
            title: "6. Propiedad de Datos",
            icon: "database",
            content: (
                <div className="space-y-4">
                    <p><strong>El Usuario conserva la titularidad exclusiva de todos los datos, información y archivos</strong> que cargue o genere a través del servicio ("Datos del Cliente"). RestoGestión no reclama ningún derecho de propiedad intelectual sobre los Datos del Cliente.</p>
                    <p>RestoGestión tendrá acceso a los Datos del Cliente para la prestación del servicio, soporte técnico, seguridad de la red y para análisis estadísticos agregados y anónimos para la mejora del producto.</p>
                </div>
            )
        },
        {
            id: 7,
            title: "7. Confidencialidad",
            icon: "lock",
            content: (
                <p>Ambas partes se obligan a mantener la confidencialidad de la información sensible intercambiada. RestoGestión garantiza que todo su personal y colaboradores han suscrito Acuerdos de Confidencialidad (NDAs) y están sujetos al secreto profesional respecto de la información comercial de los usuarios.</p>
            )
        },
        {
            id: 8,
            title: "8. Seguridad de la Información",
            icon: "shield",
            content: (
                <div className="space-y-4">
                    <p>RestoGestión implementa medidas técnicas y organizativas robustas para proteger la información, incluyendo:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-400">
                        <li>Encriptación de datos en tránsito (SSL/TLS) y en almacenamiento.</li>
                        <li>Sistemas de respaldo de datos ("Backups") en la nube cada h24/7 para garantizar que ningún usuario pierda acceso a sus datos.</li>
                        <li>Capas de seguridad perimetral y firewalls geográficos.</li>
                        <li>Auditorías de seguridad periódicas y monitoreo 24/7.</li>
                    </ul>
                </div>
            )
        },
        {
            id: 9,
            title: "9. Limitación de Responsabilidad",
            icon: "warning",
            content: (
                <p>En la máxima medida permitida por la ley ecuatoriana, RestoGestión no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo lucro cesante o pérdida de datos, derivados del uso del servicio, a menos que sea por irresponsabilidad comprobada del servicio.</p>
            )
        },
        {
            id: 10,
            title: "10. Suspensión y Terminación",
            icon: "cancel",
            content: (
                <p>RestoGestión se reserva el derecho de suspender o terminar el acceso al servicio en caso de falta de pago, violación de estos Términos, o requerimiento judicial. El usuario puede cancelar su suscripción en cualquier momento, sujeto a las condiciones de su plan contratado.</p>
            )
        },
        {
            id: 11,
            title: "11. Eliminación y Portabilidad de Datos (LOPDP)",
            icon: "delete_forever",
            content: (
                <div className="space-y-4">
                    <p>En cumplimiento con la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador, el Usuario tiene derecho al acceso, rectificación, actualización y eliminación de sus datos.</p>
                    <p>Al finalizar la relación contractual, el Usuario podrá solicitar la exportación de sus datos en un formato estructurado y legible por máquina. Posteriormente, RestoGestión procederá a eliminar de forma segura los datos, salvo aquellos que deba conservar por obligación legal.</p>
                </div>
            )
        },
        {
            id: 12,
            title: "12. Cumplimiento Normativo",
            icon: "account_balance",
            content: (
                <p>Este contrato se rige por la legislación de la República del Ecuador, incluyendo la Ley de Comercio Electrónico, Firmas Electrónicas y Mensajes de Datos, y la Ley Orgánica de Protección de Datos Personales.</p>
            )
        },
        {
            id: 13,
            title: "13. Modificaciones",
            icon: "edit",
            content: (
                <p>RestoGestión podrá actualizar estos términos periódicamente. Notificaremos cambios relevantes a través del correo electrónico registrado o mediante un aviso en la plataforma. El uso continuado del servicio después de dichos cambios constituirá su aceptación de los nuevos términos.</p>
            )
        },
        {
            id: 14,
            title: "14. Jurisdicción y Ley Aplicable",
            icon: "gavel",
            content: (
                <p>Para la resolución de cualquier controversia que surja del presente contrato o el uso del servicio, las partes se someten a la jurisdicción de los jueces competentes de la ciudad de Quito, Ecuador, renunciando a cualquier otro fuero que pudiera corresponderles.</p>
            )
        }
    ];

    return (
        <div className="bg-[#0F172A] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden min-h-screen">
            <LandingHeader />

            <main className="flex-1 flex flex-col items-center w-full pt-32 pb-20 px-4">
                <div className="max-w-4xl w-full">
                    {/* Hero Header */}
                    <div className="text-center mb-12 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[10px] font-bold uppercase tracking-wider mb-2">
                            <span className="material-symbols-outlined text-sm">fact_check</span>
                            Documentación Legal
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                            Términos y Condiciones de Uso
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Última actualización: 14 de Octubre de 2023</p>
                    </div>

                    {/* Intro Alert */}
                    <div className="bg-blue-900/20 border border-blue-800/50 p-6 rounded-2xl mb-8 flex gap-4 items-start">
                        <span className="material-symbols-outlined text-blue-400 shrink-0 mt-1">info</span>
                        <p className="text-sm text-blue-200 leading-relaxed">
                            <strong>Aviso Importante:</strong> Por favor, lea detenidamente estos Términos y Condiciones antes de utilizar el servicio de RestoGestión ERP. Este documento constituye un acuerdo legal vinculante entre Usted (el "Usuario" o el "Restaurante") y RestoGestión (el "Prestador"). Al acceder o utilizar nuestros servicios usted acepta estar legalmente obligado por estas condiciones.
                        </p>
                    </div>

                    {/* Table of Contents */}
                    <div className="mb-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">list</span>
                            Índice de Contenidos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors text-left group"
                                >
                                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">{section.id}</span>
                                    {section.title.split('. ')[1]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sections Accordion */}
                    <div className="space-y-4">
                        {sections.map(section => (
                            <div
                                key={section.id}
                                id={`section-${section.id}`}
                                className={`scroll-mt-32 bg-[#1E293B]/50 border transition-all rounded-2xl overflow-hidden ${openSections.includes(section.id) ? 'border-blue-500/50' : 'border-slate-800 hover:border-slate-700'}`}
                            >
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between p-6 text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${openSections.includes(section.id) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                            <span className="material-symbols-outlined">{section.icon}</span>
                                        </div>
                                        <h2 className="text-lg font-bold text-white">{section.title}</h2>
                                    </div>
                                    <span className={`material-symbols-outlined transition-transform duration-300 ${openSections.includes(section.id) ? 'rotate-180 text-blue-500' : 'text-slate-500'}`}>
                                        expand_more
                                    </span>
                                </button>

                                <div className={`px-6 pb-6 overflow-hidden transition-all duration-300 ease-in-out ${openSections.includes(section.id) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                                    <div className="pt-2 border-t border-slate-800/50 text-slate-300 leading-relaxed text-sm">
                                        {section.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
};

export default TermsView;
