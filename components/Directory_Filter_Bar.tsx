'use client';
import {useState, useEffect} from 'react';
import Select from 'react-select';
import { useParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function DirectoryFilterBar() {
  const [areaOptions, setAreaOptions] = useState<{value: string, label: string}[]>([]);
  const [companyTypeOptions, setCompanyTypeOptions] = useState<{value: string, label: string}[]>([]);
  const [countryOptions, setCountryOptions] = useState<{value: string, label: string}[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [selectedCompanyType, setSelectedCompanyType] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const params = useParams();
  const router = useRouter();
  const isSlugPage = params.slug !== undefined;
  const isDirPage = usePathname() === ('/dir');

  useEffect(() => {
    // Set client flag
    setIsClient(true);
    
    const fetchOptions = () => {
      // Get all elements with data-areas attribute
      const elementsWithAreas = document.querySelectorAll('[data-areas]');
      const allAreas = new Set<string>();
      
      elementsWithAreas.forEach(element => {
        const areasData = element.getAttribute('data-areas');
        if (areasData) {
          // Split by comma and trim whitespace
          const areas = areasData.split(',').map(area => area.trim()).filter(area => area.length > 0);
          areas.forEach(area => allAreas.add(area));
        }
      });
      // Convert Set to array and create options
      const areaOptionsArray = Array.from(allAreas).map(area => ({
        value: area,
        label: area
      }));
      setAreaOptions(areaOptionsArray);
      
      // Get all elements with data-country attribute
      const elementsWithCountries = document.querySelectorAll('[data-country]');
      const allCountries = new Set<string>();
      
      elementsWithCountries.forEach(element => {
        const countryData = element.getAttribute('data-country');
        if (countryData) {
          allCountries.add(countryData.trim());
        }
      });
      // Convert Set to array and create options
      const countryOptionsArray = Array.from(allCountries).map(country => ({
        value: country,
        label: country
      }));
      setCountryOptions(countryOptionsArray);
      
      // Get all elements with data-companytype attribute
      const elementdWithCompanyTypes = document.querySelectorAll('[data-companytype]');
      const allCompanyTypes = new Set<string>();
      elementdWithCompanyTypes.forEach(element => {
        const companyType = element.getAttribute('data-companytype');
        if (companyType) {
          allCompanyTypes.add(companyType);
        }
      });
      const companyTypeOptionsArray = Array.from(allCompanyTypes).map(companyType => ({
        value: companyType,
        label: companyType
      }));
      setCompanyTypeOptions(companyTypeOptionsArray);
    };
    
    // Use MutationObserver to watch for when company elements are added
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if any added nodes contain company elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.querySelector('[data-companytype]') || 
                  element.hasAttribute('data-companytype')) {
                shouldUpdate = true;
              }
            }
          });
        }
      });
      
      if (shouldUpdate) {
        fetchOptions();
      }
    });
    
    // Start observing the directory list container
    const directoryList = document.getElementById('directory-list');
    if (directoryList) {
      observer.observe(directoryList, {
        childList: true,
        subtree: true
      });
    }
    
    // Also try to fetch immediately in case elements are already there
    fetchOptions();
    
    return () => observer.disconnect();
  }, []);

  // Apply filters when selections change
  useEffect(() => {
    if (!isClient) return;

    const applyFilters = () => {
      const companyElements = document.querySelectorAll('[data-companytype]');
      const directoryList = document.getElementById('directory-list');
      
      // Check if all filters are set to 'all'
      const allFiltersAreAll = selectedCompanyType === 'all' && selectedArea === 'all' && selectedCountry === 'all';
      
      if (allFiltersAreAll) {
        // If all filters are 'all', show all elements and set style to 'letters'
        companyElements.forEach(element => {
          (element as HTMLElement).style.display = '';
        });
        if (directoryList) {
          directoryList.setAttribute('data-liststyle', 'letters');
        }
        return;
      }
      
      // Apply filters
      companyElements.forEach(element => {
        const companyType = element.getAttribute('data-companytype');
        const areas = element.getAttribute('data-areas') || '';
        const country = element.getAttribute('data-country') || '';
        
        let shouldShow = true;
        
        // Filter by company type
        if (selectedCompanyType !== 'all' && companyType !== selectedCompanyType) {
          shouldShow = false;
        }
        
        // Filter by area
        if (selectedArea !== 'all' && !areas.includes(selectedArea)) {
          shouldShow = false;
        }
        
        // Filter by country
        if (selectedCountry !== 'all' && country !== selectedCountry) {
          shouldShow = false;
        }
        
        // Show/hide element
        if (shouldShow) {
          (element as HTMLElement).style.display = '';
        } else {
          (element as HTMLElement).style.display = 'none';
        }
      });

      // Set directory list style to 'filters' when any filter is active
      if (directoryList) {
        directoryList.setAttribute('data-liststyle', 'filters');
      }
    };

    applyFilters();
  }, [selectedCompanyType, selectedArea, selectedCountry, isClient]);
  
  return (
    <div className="w-full mb-12 py-2 bg-qellow">
      <div className='max-w-maxw mx-auto px-container'>
        { isDirPage ? (
          <div id="directory-filter-bar" className="md:w-3/4 ml-auto text-lg font-[600] tracking-tight flex flex-col md:flex-row md:items-center">
            <div>
              Show 
            </div>
            {isClient ? (
              <Select 
                unstyled
                instanceId="company-type-select"
                className="inline-block"
                value={{value: selectedCompanyType, label: selectedCompanyType === 'all' ? 'all of the companies' : selectedCompanyType}}
                onChange={(option) => setSelectedCompanyType(option?.value || 'all')}
                classNames={{
                  control: (state) => state.isFocused 
                    ? 'text-lg text-qlack/30 font-[400] tracking-tight md:mx-1 px-2 md:rounded-t-lg bg-qaupe border-b border-qlack/30' 
                    : 'text-lg font-[400] tracking-tight md:mx-1 md:px-2 md:rounded-lg md:hover:bg-qaupe border-b border-transparent',
                  menu: () => 'bg-qaupe rounded-lg rounded-tl-none md:ml-1 text-lg font-[400] tracking-tight p-4 shadow-lg whitespace-nowrap md:min-w-[300px]',
                  placeholder: () => 'text-qlack/30 whitespace-nowrap',
                  option: () => 'text-qlack whitespace-nowrap',
                  input: () => 'text-qlack whitespace-nowrap',
                }}
                options={[{value: 'all', label: 'all of the companies'}, ...companyTypeOptions]}
              />
            ) : (
              <span className="inline-block mx-1 px-2 rounded-lg hover:bg-qaupe text-lg font-[400] tracking-tight">
                all of the companies
              </span>
            )}
            
            <div>
              proficient in 
            </div>
            {isClient ? (
              <Select
                unstyled
                instanceId="area-select"
                className="inline-block"
                value={{value: selectedArea, label: selectedArea === 'all' ? 'all of the quals sectors' : selectedArea}}
                onChange={(option) => setSelectedArea(option?.value || 'all')}
                classNames={{
                  control: (state) => state.isFocused 
                    ? 'text-lg text-qlack/30 font-[400] tracking-tight md:mx-1 px-2 md:rounded-t-lg bg-qaupe border-b border-qlack/30' 
                    : 'text-lg font-[400] tracking-tight md:mx-1 md:px-2 md:rounded-lg md:hover:bg-qaupe border-b border-transparent',
                  menu: () => 'bg-qaupe rounded-lg rounded-tl-none md:ml-1 text-lg font-[400] tracking-tight p-4 shadow-lg whitespace-nowrap md:min-w-[300px]',
                  placeholder: () => 'text-qlack/30 whitespace-nowrap',
                  option: () => 'text-qlack whitespace-nowrap',
                  input: () => 'text-qlack whitespace-nowrap',
                }}
                options={[{value: 'all', label: 'all of the quals sectors'}, ...areaOptions]}
              />
            ) : (
              <span className="inline-block mx-1 px-2 rounded-lg hover:bg-qaupe text-lg font-[400] tracking-tight">
                all of the quals sectors
              </span>
            )}
            
            <div>
              from 
            </div>
            {isClient ? (
              <Select
                unstyled
                instanceId="country-filter-select"
                className="inline-block"
                value={{value: selectedCountry, label: selectedCountry === 'all' ? 'all over the world' : selectedCountry}}
                onChange={(option) => setSelectedCountry(option?.value || 'all')}
                classNames={{
                  control: (state) => state.isFocused 
                    ? 'text-lg text-qlack/30 font-[400] tracking-tight md:mx-1 px-2 md:rounded-t-lg bg-qaupe border-b border-qlack/30' 
                    : 'text-lg font-[400] tracking-tight md:mx-1 md:px-2 md:rounded-lg md:hover:bg-qaupe border-b border-transparent',
                  menu: () => 'bg-qaupe rounded-lg rounded-tl-none md:ml-1 text-lg font-[400] tracking-tight p-4 shadow-lg whitespace-nowrap md:min-w-[300px]',
                  placeholder: () => 'text-qlack/30 whitespace-nowrap',
                  option: () => 'text-qlack whitespace-nowrap',
                  input: () => 'text-qlack whitespace-nowrap',
                }}
                options={[{value: 'all', label: 'all over the world'}, ...countryOptions]}
              />
            ) : (
              <span className="inline-block mx-1 px-2 rounded-lg hover:bg-qaupe text-lg font-[400] tracking-tight">
                all over the world
              </span>
            )}
            
          </div>
        ) : !isDirPage && !isSlugPage ? (
          <div id="directory-filter-bar" className="md:w-3/4 ml-auto text-lg font-[600] tracking-tight flex flex-col md:flex-row md:items-center">
            <Link 
              href="/dir"
              className="cursor-pointer min-h-[38px] flex items-center gap-2 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft/> Back to Directory
            </Link>
          </div>
        ) : (
          <div id="directory-filter-bar" className="md:w-3/4 ml-auto text-lg font-[600] tracking-tight flex flex-col md:flex-row md:items-center">
            <button 
              onClick={() => router.back()} 
              className="cursor-pointer min-h-[38px] flex items-center gap-2 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft/> Back 
            </button>
          </div>
        )}
      </div>
    </div>
  )
}