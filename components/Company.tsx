import Image from "next/image";
import Link from "next/link";
import { profOrgsNameMap } from "@/lib/utils";
import { countries } from "@/lib/countries";
import Fern from "@/components/svgs/Fern";

interface CompanyProps {
  data : {
    id: string;
    name: string;
    type: string;
    narrative: string;
    companysize: string;
    established: string;
    gradprog: string;
    proforgs?: string;
    prsaward?: string;
    accred?: string;
    contact_info?: {
      id: string;
      company_id: string;
      email: string;
      phone: string;
      mobile?: string;
      addr1?: string;
      addr2?: string;
      addr3?: string;
      addr4?: string;
      addr5?: string;
      postcode?: string;
      country?: string;
      facebook?: string;
      linkedin?: string;
      twitter?: string;
      youtube?: string;
      website?: string;
    } | null;
    employees?: {
      id: string;
      firstname: string;
      lastname: string;
      organisation: string;
      slug: string;
    }[] | null;
    areas?: {[key: string]: string[]};
    logo: { data: { publicUrl: string } | null };
  }
}

export default function Company(props: CompanyProps) {

  const { data } = props;

  if (!data) {
    return <div>No company data available.</div>;
  }

  const checkLinkedInLinkAndTransform = (link: string | null) => {
    if (!link) return null;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    return `https://www.linkedin.com/company/${link}`;
  }
  const checkFacebookLinkAndTransform = (link: string | null) => {
    if (!link) return null;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    return `https://www.facebook.com/${link}`;
  }
  const checkTwitterLinkAndTransform = (link: string | null) => {
    if (!link) return null;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    return `https://www.twitter.com/${link}`;
  }
  const checkYouTubeLinkAndTransform = (link: string | null) => {
    if (!link) return null;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    return `https://www.youtube.com/${link}`;
  }

  const companyCountryFlag = countries.find(country => country.name === data.contact_info?.country)?.code;

  const renderAwards = () => {
    if (!data.prsaward) return null;
    const awards = data.prsaward.split(',').map(award => award.trim());
    awards.forEach((award, index) => {
      if (!award) return null;
      if (Number(award) < 2016 ) {
        const awardYear = award;
        award = 'Prosper Riley-Smith Qualitative Effectiveness Award Winner ' + awardYear;
      }
      else {
        award = 'AQR Qualitative Excellence Award Winner ' + award;
      }
      awards[index] = award;
    });
    return (
      <ul className="flex flex-col md:flex-row gap-8 mx-0!">
        {awards.map(award => (
          <li key={award} className="text-[1.375rem] relative md:basis-1/3 list-none px-6">
            <div className="absolute top-0 left-0 h-full w-auto">
              <Fern />
            </div>
            <div className="text-center">
              <div className="uppercase text-[1.375rem] tracking-[0.04rem] mb-2 leading-[1.374rem]">Winner</div>
              <div className="text-base my-0 leading-[1.374rem]">{award}</div>
            </div>
            <div className="absolute top-0 right-0 h-full w-auto">
              <Fern mirrored />
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderProfessionalOrganizations = () => {
    if (!data.proforgs) return null;
    const orgs = data.proforgs.split(',').map(org => org.trim());
    return (
      <ul className="space-y-2 pl-8">
        {orgs.map(org => (
          <li key={org} className="text-[1.375rem] flex items-start gap-2">
            <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="basis-4 shrink-0 grow-0 relative top-2">
              <path d="M6.5501 12.5001L0.850098 6.8001L2.2751 5.3751L6.5501 9.6501L15.7251 0.475098L17.1501 1.9001L6.5501 12.5001Z" fill="#1D1B20"/>
            </svg>
            <span>{profOrgsNameMap[org] || org}</span>
          </li>
        ))}
      </ul>
    );  
  }

  const tranformedLogoUrl = data.logo.data?.publicUrl 
    ? `https://lucent-kashata-62c75a.netlify.app/.netlify/images?url=${encodeURIComponent(data.logo.data.publicUrl)}&w=240` 
    : null;

  let sanitizedNarrative = data.narrative ? data.narrative : '';
  // if sanitizedNarrative starts without an html tag, add a <p> tag to the beginning and a </p> tag before the next html tag
  if (!sanitizedNarrative.startsWith('<p>')) {
    sanitizedNarrative = '<p>' + sanitizedNarrative + '</p>';
  }
  if (!sanitizedNarrative.endsWith('</p>')) {
    sanitizedNarrative = sanitizedNarrative + '</p>';
  }

  return (
    <article 
      className="
        w-full max-w-[1080px] mx-auto box-border space-y-12
      "
    >
        <section>
          <div className="flex flex-col md:flex-row items-center md:gap-6 mb-8 p-4 md:px-7.5 border border-qlack bg-white rounded-lg">
            {data.logo && data.logo.data && data.logo.data.publicUrl 
              ?
              <figure className="relative h-24 max-w-40 flex items-center"> 
                <img 
                  key={`${data.logo.data?.publicUrl || ''}`}
                  // src={`${data.logo.data?.publicUrl || ''}?t=${Date.now()}`}
                  // src={`${data.logo.data?.publicUrl || ''}?t=${Date.now()}`}
                  src={tranformedLogoUrl || ''}
                  sizes="(max-width:768px) 100vw, 225px"
                  alt={data.name + ' logo'}
                  className="w-full h-full object-contain object-left"
                />
              </figure>
              :
              <div className="bg-gray-100 aspect-square flex justify-center items-center w-24 text-xs text-center p-4 mb-4">No logo available</div>
            }
            <p className="text-base uppercase tracking-[0.04rem]">{data.type}</p>
          </div>
          <h1 className="text-6xl md:text-[6.25rem] leading-[0.95] tracking-[-0.1875rem] mb-6">
            <a href={data.contact_info?.website} target="_blank" rel="noopener noreferrer" className="relative">
              {data.name}
              <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 md:w-8 absolute bottom-10 md:bottom-19 left-[calc(100%+1rem)]">
                <path d="M4.91519 3H32V30.3415M31.7278 3L3 32" stroke="black" strokeWidth="6"/>
              </svg>
            </a>
          </h1>
          <div className="flex items-start gap-4 mb-12">
            <img
              alt={data.contact_info?.country || 'UK'}
              src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${companyCountryFlag || 'UK'}.svg`}
              className="w-12 h-auto aspect-[1.5] relative top-1"
            />
            {data.contact_info && (
              <div className="text-xs">
                {data.contact_info.addr1 && <p>{data.contact_info.addr1}</p>}
                {data.contact_info.addr2 && <p>{data.contact_info.addr2}</p>}
                {data.contact_info.addr3 && <p>{data.contact_info.addr3}</p>}
                {data.contact_info.addr4 && <p>{data.contact_info.addr4}</p>}
                {data.contact_info.addr5 && <p>{data.contact_info.addr5}</p>}
                {data.contact_info.postcode && <p>{data.contact_info.postcode}</p>}
                {data.contact_info.country && <p>{data.contact_info.country}</p>}
              </div>
            )}
          </div>
          <p className="text-[1.375rem] leading-[1.318] max-w-180 mb-12">
            {data.name} is a {data.type} 
            {data.established && 
              <>&nbsp;established in {data.established}</>
            }
            {data.companysize && 
              <>&nbsp;with {data.companysize} full-time employees</>
            }.
          </p>
        </section>

        <section id="contact-info">
          <svg className="h-[2px] w-full" width="100%" height="100%">
            <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          <div className="flex flex-col md:flex-row items-start gap-12 py-4 w-full overflow-hidden">
            {/* contact info */}
            <div> 
              {data.contact_info?.email &&
                <div className="flex items-center gap-2 whitespace-nowrap">
                  {/* envelope icon */}
                  <svg width="14" height="9" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 0.851064C14 0.381915 13.6141 0 13.14 0H0.860017C0.385933 0 0 0.381915 0 0.851064V8.15106C0 8.3766 0.0903018 8.58191 0.23543 8.73404C0.392383 8.89787 0.613837 9 0.858942 9H13.1389C13.3851 9 13.6055 8.89681 13.7624 8.73298C13.9086 8.58085 13.9979 8.37553 13.9979 8.14894V0.851064H14ZM0.645013 1.11702L4.79137 4.54894L0.645013 7.98085V1.11702ZM8.54749 4.26383C8.51309 4.28298 8.48084 4.30745 8.45397 4.33936C8.45289 4.34149 8.45182 4.34255 8.45074 4.34468L7.00054 5.54468L5.55033 4.34468C5.55033 4.34468 5.54818 4.34149 5.54711 4.33936C5.52023 4.30745 5.48798 4.28298 5.45358 4.26383L1.07287 0.638298H12.9282L8.54749 4.26383ZM5.2934 4.96489L6.79306 6.20638C6.85326 6.25638 6.92636 6.28085 6.99946 6.28085C7.07256 6.28085 7.14674 6.25638 7.20587 6.20638L8.70552 4.96489L12.8121 8.36489H1.18682L5.2934 4.96489ZM9.20971 4.54894L13.355 1.11702V7.98085L9.20863 4.54894H9.20971Z" fill="#11160C"/>
                  </svg>
                  <p>
                    <a 
                      href={`mailto:${data.contact_info?.email}`}
                      className="no-underline! hover:text-qreen-dark transition-colors duration-300"
                    >{data.contact_info?.email}</a>
                    </p>
                </div>
              }
              {data.contact_info?.phone &&
                <div className="flex items-center gap-2 w-full overflow-hidden whitespace-nowrap">
                  {/* mobile icon */}
                  <svg width="9" height="15" viewBox="0 0 9 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.2 13.8438V14.5H1.8V13.8438H7.2ZM8.325 12.75V2.25C8.325 1.64594 7.82132 1.15625 7.2 1.15625H1.8C1.17868 1.15625 0.675 1.64594 0.675 2.25V12.75C0.675 13.3541 1.17868 13.8438 1.8 13.8438V14.5L1.61631 14.4906C0.7085 14.4011 0 13.6562 0 12.75V2.25C0 1.2835 0.805887 0.5 1.8 0.5H7.2C8.19411 0.5 9 1.2835 9 2.25V12.75C9 13.7165 8.19411 14.5 7.2 14.5V13.8438C7.82132 13.8438 8.325 13.3541 8.325 12.75ZM5.10732 2.51233C5.29366 2.51233 5.44473 2.65931 5.44482 2.84045C5.44482 3.02167 5.29372 3.16858 5.10732 3.16858H3.89268C3.70628 3.16858 3.55518 3.02167 3.55518 2.84045C3.55527 2.65931 3.70634 2.51233 3.89268 2.51233H5.10732Z" fill="#11160C"/>
                  </svg>
                  <p>
                    <a 
                      href={`tel:${data.contact_info?.phone}`}
                      className="no-underline! hover:text-qreen-dark transition-colors duration-300"
                    >
                      {data.contact_info?.phone}
                    </a>
                  </p>
                </div>
              }
              {data.contact_info?.mobile &&
                <div className="flex items-center gap-2 w-full overflow-hidden whitespace-nowrap">
                  {/* mobile icon */}
                  <svg width="9" height="15" viewBox="0 0 9 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.2 13.8438V14.5H1.8V13.8438H7.2ZM8.325 12.75V2.25C8.325 1.64594 7.82132 1.15625 7.2 1.15625H1.8C1.17868 1.15625 0.675 1.64594 0.675 2.25V12.75C0.675 13.3541 1.17868 13.8438 1.8 13.8438V14.5L1.61631 14.4906C0.7085 14.4011 0 13.6562 0 12.75V2.25C0 1.2835 0.805887 0.5 1.8 0.5H7.2C8.19411 0.5 9 1.2835 9 2.25V12.75C9 13.7165 8.19411 14.5 7.2 14.5V13.8438C7.82132 13.8438 8.325 13.3541 8.325 12.75ZM5.10732 2.51233C5.29366 2.51233 5.44473 2.65931 5.44482 2.84045C5.44482 3.02167 5.29372 3.16858 5.10732 3.16858H3.89268C3.70628 3.16858 3.55518 3.02167 3.55518 2.84045C3.55527 2.65931 3.70634 2.51233 3.89268 2.51233H5.10732Z" fill="#11160C"/>
                  </svg>
                  <p>
                    <a 
                      href={`tel:${data.contact_info?.mobile}`}
                      className="no-underline! hover:text-qreen-dark transition-colors duration-300"
                    >
                      {data.contact_info?.mobile}
                    </a>
                  </p>
                </div>
              }
              {data.contact_info?.website &&
                <div className="flex items-center gap-2 w-full overflow-hidden whitespace-nowrap">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 0C2.23858 0 0 2.23858 0 5C0 7.76142 2.23858 10 5 10C7.76142 10 10 7.76142 10 5C10 2.23858 7.76142 0 5 0ZM5 8.33333C3.80653 8.33333 2.83333 7.36013 2.83333 6.16667C2.83333 4.9732 3.80653 4 5 4C6.19347 4 7.16667 4.9732 7.16667 6.16667C7.16667 7.36013 6.19347 8.33333 5 8.33333Z" fill="#11160C"/>
                  </svg>
                  <p>
                    <a href={data.contact_info?.website} target="_blank" rel="noopener noreferrer" className="no-underline! hover:text-qreen-dark transition-colors duration-300"> 
                      {data.contact_info?.website}
                    </a>
                  </p>
                </div>
              }
            </div>
            
            {/* social media */}
            <div>
              {data.contact_info?.linkedin &&
                <a 
                  href={`${data.contact_info?.linkedin}`}
                  className="text-qreen-dark flex items-center gap-2 no-underline!"
                >
                  LinkedIn 
                  <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.52833 1.5H9V9.04247M8.92491 1.5L1 9.5" stroke="#3C772B" strokeWidth="1.5"/>
                  </svg>
                </a>
              }
              {data.contact_info?.twitter &&  
                  <a 
                    href={`tel:${data.contact_info?.twitter}`}
                    className="text-qreen-dark flex items-center gap-2 no-underline!"
                  >
                    X 
                    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.52833 1.5H9V9.04247M8.92491 1.5L1 9.5" stroke="#3C772B" strokeWidth="1.5"/>
                    </svg>
                  </a>
              }
              {data.contact_info?.youtube &&
                  <a 
                    href={`tel:${data.contact_info?.youtube}`}
                    className="text-qreen-dark flex items-center gap-2 no-underline!"
                  >
                    YouTube 
                    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.52833 1.5H9V9.04247M8.92491 1.5L1 9.5" stroke="#3C772B" strokeWidth="1.5"/>
                    </svg>
                  </a>
              }
              {data.contact_info?.facebook &&
                  <a 
                    href={`tel:${data.contact_info?.facebook}`}
                    className="text-qreen-dark flex items-center gap-2 no-underline!"
                  >
                    Facebook 
                    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.52833 1.5H9V9.04247M8.92491 1.5L1 9.5" stroke="#3C772B" strokeWidth="1.5"/>
                    </svg>
                  </a>
              }
            </div>
          </div>

          <svg className="h-[2px] w-full" width="100%" height="100%">
            <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </section>

        {data.areas && Object.keys(data.areas).length > 0 && (
        <section id="areas">
            <div className="space-y-24">
              {Object.entries(data.areas).map(([category, areas]) => {
                // Map category name to URL parameter name
                const getCategoryParam = (cat: string): string | null => {
                  if (cat === 'Business Sectors') return 'sectors';
                  if (cat === 'Skills, Expertise & Services') return 'skills';
                  if (cat === 'Recruitment Expertise') return 'recruitment';
                  return null;
                };

                const categoryParam = getCategoryParam(category);

                return (
                  <div key={category} className="space-y-5">
                    <h2 className="text-[2.375rem] leading-none">{category}</h2>
                    <svg className="h-[2px] w-full" width="100%" height="100%">
                      <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
                    </svg>
                    <ul className="flex flex-wrap gap-2">
                      {areas.map((area, index) => {
                        const areaUrl = categoryParam 
                          ? `/dir/advanced?${categoryParam}=${encodeURIComponent(area)}`
                          : '/dir/advanced';
                        
                        return (
                          <li key={`${category}-${area}-${index}`}>
                            <Link
                              href={areaUrl}
                              className="text-qreen-dark bg-qellow px-3 py-1 rounded-full hover:bg-qreen-dark hover:text-qellow transition-colors inline-block"
                            >
                              {area}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
        </section>
        )}

        <section id="narrative">
          <div 
            className="pl-8 prose" 
            dangerouslySetInnerHTML={{ __html: sanitizedNarrative }} 
          />
        </section>

      {data.employees && data.employees.length > 0 && (
      <section id="employees" className="space-y-5 mt-24">
        <h2 className="text-[2.375rem] leading-none">Employees who are AQR members</h2>
        <svg className="h-[2px] w-full" width="100%" height="100%">
          <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        <ul className="md:columns-2 lg:columns-3 space-y-2 pl-8">
          {data.employees.map(emp => (
            <li key={emp.id} className="text-[1.375rem] hover:text-qreen-dark">
              <a href={`/members/${emp.slug}`}>
                {emp.firstname} {emp.lastname}
              </a>
            </li>
          ))}
        </ul>
      </section>
      )}

      {data.proforgs && data.proforgs.length > 0 && (
      <section id="proforgs" className="space-y-5 mt-24">
        <h2 className="text-[2.375rem] leading-none">Membership of Professional Organisations</h2>
        <svg className="h-[2px] w-full" width="100%" height="100%">
          <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        {renderProfessionalOrganizations()}
      </section>
      )}



      {data.accred && (
      <section id="accred" className="space-y-5 mt-24">
        <h2 className="text-[2.375rem] leading-none">Standards Compliance Accreditations</h2>
        <svg className="h-[2px] w-full" width="100%" height="100%">
          <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        <ul className="space-y-2 pl-8">
          {data.accred.split(',').map((accreditation, index) => (
            <li key={index} className="text-[1.375rem] flex items-start gap-2">
              <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="basis-4 shrink-0 grow-0 relative top-2">
                <path d="M6.5501 12.5001L0.850098 6.8001L2.2751 5.3751L6.5501 9.6501L15.7251 0.475098L17.1501 1.9001L6.5501 12.5001Z" fill="#1D1B20"/>
              </svg>
              <span>{accreditation.trim()}</span>
            </li>
          ))}
        </ul>
      </section>
      )}

      {(data.gradprog === "Yes" || data.gradprog === "YES") && (
      <section id="gradprog" className="space-y-5 mt-24">
        <h2 className="text-[2.375rem] leading-none">Training Opportunities</h2>
        <svg className="h-[2px] w-full" width="100%" height="100%">
          <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        <p className="text-[1.375rem]">
          {data.name} operates a graduate training programme. Please contact {data.name} directly for more information about their training programme and employment opportunities.
        </p>
      </section>    
      )}

      {data.prsaward && (
      <section id="prsaward" className="space-y-5 mt-24">
        <h2 className="text-[2.375rem] leading-none">AQR Awards</h2>
        <svg className="h-[2px] w-full" width="100%" height="100%">
          <rect x="1" y="1" width="100%" height="100%" fill="none" stroke="var(--color-qlack)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        <div 
          className="prose" 
        >
          {renderAwards()}
        </div>
      </section>    
      )}

    </article>
  );
}