import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('API route called at:', new Date().toISOString());
  try {
    const body = await request.json();
    console.log('API received filters:', body);
    const {
      companyTypes = [],
      sectors = [],
      skills = [],
      recruitment = [],
      countries = []
    } = body;

    const supabase = await createClient();

    // Start with base query for active companies
    let query = supabase
      .from('companies')
      .select('*')
      .eq('beacon_membership_status', 'Active');

    // Apply company type filter
    if (companyTypes.length > 0) {
      query = query.in('type', companyTypes);
    }

    // Get all companies first
    const { data: companies, error: companiesError } = await query;

    if (companiesError) {
      console.error('Companies query error:', companiesError);
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json({ companies: [] });
    }

    // Fetch contact info and areas separately
    const { data: companyContactInfo, error: contactError } = await supabase
      .from('company_contact_info')
      .select('*');

    const { data: companyAreas, error: areasError } = await supabase
      .from('company_areas')
      .select('*');

    if (contactError) {
      console.error('Contact info query error:', contactError);
      return NextResponse.json({ error: 'Failed to fetch contact info' }, { status: 500 });
    }

    if (areasError) {
      console.error('Areas query error:', areasError);
      return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 });
    }

    // Combine the data
    const companiesWithContactInfo = companies.map(company => ({
      ...company,
      company_contact_info: companyContactInfo?.filter(contact => contact.company_id === company.id) || [],
      company_areas: companyAreas?.filter(area => area.company_id === company.id) || []
    }));

    // Fetch company logos
    const { data: allCompanyFiles, error: logoError } = await supabase
      .storage
      .from('images')
      .list('companies');
    
    if (logoError) {
      console.error("Storage error:", logoError);
    }
    
    // Filter files to only include those that match our company IDs
    const companyIds = companiesWithContactInfo.map(company => company.id);
    const filteredLogos = allCompanyFiles?.filter(file => {
      // Extract the file name without extension
      const fileNameWithoutExt = file.name.replace(/\.(jpg|jpeg|png|gif)$/i, '');
      return companyIds.includes(fileNameWithoutExt);
    }) || [];
    
    // Generate public URLs for each logo
    const companyLogos = filteredLogos.map(file => {
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(`companies/${file.name}`);
      
      return {
        ...file,
        publicUrl: data.publicUrl
      };
    });

    // Apply all filters with AND logic between categories
    let filteredCompanies = companiesWithContactInfo;

    // Filter by company type
    if (companyTypes.length > 0) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.type && companyTypes.includes(company.type)
      );
    }

    // Filter by country
    if (countries.length > 0) {
      filteredCompanies = filteredCompanies.filter(company => {
        if (!company.company_contact_info || company.company_contact_info.length === 0) {
          return false;
        }
        
        const companyCountry = company.company_contact_info[0]?.country;
        if (!companyCountry) {
          return false;
        }
        
        // Normalize both sides for comparison
        const normalizedCompanyCountry = companyCountry.trim().toLowerCase();
        return countries.some((country: string) => 
          country.trim().toLowerCase() === normalizedCompanyCountry
        );
      });
    }

    // Filter by areas with AND logic between categories, OR logic within categories
    if (sectors.length > 0 || skills.length > 0 || recruitment.length > 0) {
      // Get all areas that match our criteria
      const allAreaFilters = [...sectors, ...skills, ...recruitment];
      
      const { data: matchingAreas, error: areasError } = await supabase
        .from('areas_master')
        .select('area, category')
        .in('area', allAreaFilters);

      if (areasError) {
        console.error('Areas query error:', areasError);
        return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 });
      }

      // Group areas by category
      const sectorsInDB = matchingAreas?.filter(area => area.category === 'Business Sectors').map(a => a.area) || [];
      const skillsInDB = matchingAreas?.filter(area => area.category === 'Skills, Expertise & Services').map(a => a.area) || [];
      const recruitmentInDB = matchingAreas?.filter(area => area.category === 'Recruitment Expertise').map(a => a.area) || [];

      filteredCompanies = filteredCompanies.filter(company => {
        if (!company.company_areas || company.company_areas.length === 0) {
          return false;
        }

        const companyAreas = company.company_areas.map((ca: { area: string }) => ca.area);
        
        // Check if company matches ALL selected categories (AND logic between categories)
        let matchesSectors = true;
        let matchesSkills = true;
        let matchesRecruitment = true;

        if (sectors.length > 0) {
          matchesSectors = sectorsInDB.some(area => companyAreas.includes(area));
        }

        if (skills.length > 0) {
          matchesSkills = skillsInDB.some(area => companyAreas.includes(area));
        }

        if (recruitment.length > 0) {
          matchesRecruitment = recruitmentInDB.some(area => companyAreas.includes(area));
        }

        return matchesSectors && matchesSkills && matchesRecruitment;
      });
    }

    // Format the response
    const formattedCompanies = filteredCompanies.map(company => {
      // Find the logo for this company
      const logo = companyLogos.find(logo => {
        const fileNameWithoutExt = logo.name.replace(/\.(jpg|jpeg|png|gif)$/i, '');
        return fileNameWithoutExt === company.id;
      });

      return {
        id: company.id,
        name: company.name,
        type: company.type || '',
        slug: company.slug,
        logo: logo ? { publicUrl: logo.publicUrl } : { publicUrl: '' },
        contact_info: company.company_contact_info?.[0] || null,
        areas: company.company_areas || [],
        // Create address string similar to vflocations pattern
        address: company.company_contact_info?.[0] ? (() => {
          const contact = company.company_contact_info[0];
          const addressArray = [contact.addr2, contact.addr3, contact.addr4, contact.addr5];
          const addressString = addressArray
            .filter(item => item && item.length > 0)
            .slice(-2)
            .join(', ') + ', ' + contact.country;
          return addressString;
        })() : null
      };
    });

    return NextResponse.json({ 
      companies: formattedCompanies,
      total: formattedCompanies.length
    });

  } catch (error) {
    console.error('Filter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
